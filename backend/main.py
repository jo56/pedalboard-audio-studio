from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import uuid
import shutil
import logging
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from effects import apply_effects_chain, get_available_effects
from presets import (
    create_preset,
    list_presets,
    load_preset,
    delete_preset,
    preset_file_path,
    PresetValidationError,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pedalboard Audio Processor API")

# CORS configuration for frontend
_DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
cors_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
if cors_origins_raw:
    cors_origins = [
        origin.strip()
        for origin in cors_origins_raw.split(",")
        if origin.strip()
    ] or _DEFAULT_CORS_ORIGINS
else:
    cors_origins = _DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories for file storage
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# File size limit: 500MB (allows ~45 minutes of 24-bit/48kHz stereo WAV)
MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500MB

# Session cleanup: files older than 24 hours
SESSION_MAX_AGE_HOURS = 24

# In-memory storage for file sessions
file_sessions: Dict[str, Dict[str, Any]] = {}


class EffectConfig(BaseModel):
    type: str
    params: Dict[str, Any]


class ProcessRequest(BaseModel):
    file_id: str
    effects: Optional[List[EffectConfig]] = None
    preset_id: Optional[str] = None


class PresetCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    effects: List[EffectConfig]
    metadata: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    return {"message": "Pedalboard Audio Processor API", "status": "running"}


@app.get("/effects")
async def list_effects():
    """Get list of available audio effects with their parameters"""
    return get_available_effects()


@app.get("/presets")
async def list_saved_presets():
    """Return metadata for stored effect presets."""
    return list_presets()


@app.post("/presets")
async def create_preset_endpoint(request: PresetCreateRequest):
    """Persist a reusable effect chain preset."""
    try:
        effects_payload = [
            {"type": effect.type, "params": effect.params}
            for effect in request.effects
        ]
        preset = create_preset(
            name=request.name,
            effects=effects_payload,
            description=request.description,
            metadata=request.metadata,
        )
        return {
            "preset": preset,
            "download_url": f"/presets/{preset['id']}/download",
        }
    except PresetValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create preset: {exc}")


@app.get("/presets/{preset_id}")
async def get_preset(preset_id: str):
    """Retrieve the full preset payload."""
    try:
        return load_preset(preset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Preset not found")


@app.delete("/presets/{preset_id}")
async def remove_preset(preset_id: str):
    """Delete a stored preset."""
    try:
        delete_preset(preset_id)
        return {"message": "Preset deleted", "id": preset_id}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Preset not found")


@app.get("/presets/{preset_id}/download")
async def download_preset(preset_id: str):
    """Provide a downloadable JSON file for a preset."""
    try:
        preset_path = preset_file_path(preset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Preset not found")

    return FileResponse(
        preset_path,
        media_type="application/json",
        filename=f"preset_{preset_id}.json",
    )


def cleanup_old_sessions():
    """Remove files and sessions older than SESSION_MAX_AGE_HOURS"""
    cutoff_time = datetime.now() - timedelta(hours=SESSION_MAX_AGE_HOURS)
    sessions_to_remove = []

    for file_id, session in file_sessions.items():
        upload_time = session.get("uploaded_at")
        if upload_time and upload_time < cutoff_time:
            # Clean up files
            try:
                file_path = session.get("file_path")
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                processed_path = session.get("processed_path")
                if processed_path and os.path.exists(processed_path):
                    os.remove(processed_path)
            except Exception as e:
                logger.warning(f"Failed to clean up old files for session {file_id}: {e}")

            sessions_to_remove.append(file_id)

    for file_id in sessions_to_remove:
        del file_sessions[file_id]

    if sessions_to_remove:
        logger.info(f"Cleaned up {len(sessions_to_remove)} old sessions")


@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file and return a file_id for processing"""

    # Clean up old sessions before processing new upload
    cleanup_old_sessions()

    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Generate unique file ID
    file_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"

    # Save uploaded file with size validation
    try:
        total_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):  # Read in 8KB chunks
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE_BYTES:
                    # Clean up partial file
                    buffer.close()
                    if file_path.exists():
                        file_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB"
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        # Clean up on any error
        if file_path.exists():
            try:
                file_path.unlink()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Store session info
    file_sessions[file_id] = {
        "original_name": file.filename,
        "file_path": str(file_path),
        "extension": file_ext,
        "uploaded_at": datetime.now(),
    }

    return {
        "file_id": file_id,
        "filename": file.filename,
        "message": "File uploaded successfully"
    }


@app.post("/process")
async def process_audio(request: ProcessRequest):
    """Process audio file with effect chain or preset."""

    file_id = request.file_id

    # Validate file_id
    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]
    input_path = session["file_path"]
    extension = session["extension"]

    # Verify input file exists
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail=f"Input file no longer exists: {input_path}")

    # Resolve effect chain from request or preset
    effects_list: List[Dict[str, Any]]
    if request.preset_id:
        try:
            preset = load_preset(request.preset_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Preset not found")
        effects_list = preset.get("effects", [])
    else:
        effects_list = [
            {"type": effect.type, "params": effect.params}
            for effect in (request.effects or [])
        ]

    output_filename = f"{file_id}_processed{extension}"
    output_path = PROCESSED_DIR / output_filename

    existing_processed = session.get("processed_path")
    if existing_processed:
        # Use Path.unlink with missing_ok to avoid race condition
        try:
            Path(existing_processed).unlink(missing_ok=True)
        except Exception:
            # Ignore any errors; file will be overwritten anyway
            pass

    try:
        logger.info(f"Processing audio with {len(effects_list)} effects")
        logger.debug(f"Input: {input_path}")
        logger.debug(f"Output: {output_path}")

        apply_effects_chain(
            input_path=input_path,
            output_path=str(output_path),
            effects=effects_list,
        )

        if not os.path.exists(str(output_path)):
            raise Exception("Output file was not created successfully")

        session["processed_path"] = str(output_path)
        session["last_effects"] = effects_list

        logger.info("Processing completed successfully")

        return {
            "file_id": file_id,
            "processed": True,
            "message": "Audio processed successfully",
            "download_url": f"/download/{file_id}"
        }

    except PresetValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error processing audio: {str(e)}")
        logger.debug(error_details)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.delete("/processed/{file_id}")
async def delete_processed_only(file_id: str):
    """Delete only the processed audio while keeping the uploaded file."""

    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]
    processed_path = session.get("processed_path")

    if not processed_path or not os.path.exists(processed_path):
        raise HTTPException(status_code=404, detail="Processed file not found")

    try:
        os.remove(processed_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete processed file: {exc}")

    session.pop("processed_path", None)
    session.pop("last_effects", None)

    return {"message": "Processed audio deleted", "file_id": file_id}


@app.get("/download/{file_id}")
async def download_processed(file_id: str):
    """Download processed audio file"""

    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]

    if "processed_path" not in session:
        raise HTTPException(status_code=400, detail="File not yet processed")

    processed_path = session["processed_path"]

    if not os.path.exists(processed_path):
        raise HTTPException(status_code=404, detail="Processed file not found")

    original_name = Path(session["original_name"]).stem
    extension = session["extension"]
    download_name = f"{original_name}_processed{extension}"

    return FileResponse(
        processed_path,
        media_type="audio/mpeg",
        filename=download_name
    )


@app.delete("/cleanup/{file_id}")
async def cleanup_files(file_id: str):
    """Clean up uploaded and processed files"""

    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]

    try:
        if os.path.exists(session["file_path"]):
            os.remove(session["file_path"])
        processed_path = session.get("processed_path")
        if processed_path and os.path.exists(processed_path):
            os.remove(processed_path)

        del file_sessions[file_id]

        return {"message": "Files cleaned up successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
