from fastapi import FastAPI, UploadFile, File, HTTPException, Request
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
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from effects import apply_effects_chain, get_available_effects
from presets import (
    create_preset,
    list_presets,
    load_preset,
    delete_preset,
    preset_file_path,
    PresetValidationError,
)
from security import (
    UserSessionManager,
    sanitize_filename,
    validate_audio_file_content,
    get_client_identifier,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize rate limiter (disabled for local deployments)
# Set LOCAL_DEPLOYMENT=true in development to disable rate limiting
IS_LOCAL_DEPLOYMENT = os.getenv("LOCAL_DEPLOYMENT", "false").lower() == "true"
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Pedalboard Audio Processor API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize session manager
session_manager = UserSessionManager()

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

# File size limit: Per-user limit (managed by session_manager)
# Global absolute maximum as final safety net
ABSOLUTE_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500MB

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
    # Clean up user sessions and get list of file IDs to remove
    files_to_clean = session_manager.cleanup_expired_sessions()

    # Also clean up old file_sessions based on timestamp
    cutoff_time = datetime.now() - timedelta(hours=SESSION_MAX_AGE_HOURS)
    sessions_to_remove = []

    for file_id, session in file_sessions.items():
        upload_time = session.get("uploaded_at")
        if upload_time and upload_time < cutoff_time:
            files_to_clean.append(file_id)
            sessions_to_remove.append(file_id)

    # Clean up actual files
    for file_id in files_to_clean:
        if file_id in file_sessions:
            session = file_sessions[file_id]
            try:
                file_path = session.get("file_path")
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                processed_path = session.get("processed_path")
                if processed_path and os.path.exists(processed_path):
                    os.remove(processed_path)
            except Exception as e:
                logger.warning(f"Failed to clean up old files for session {file_id}: {e}")

    # Remove from file_sessions dict
    for file_id in sessions_to_remove:
        del file_sessions[file_id]

    if sessions_to_remove:
        logger.info(f"Cleaned up {len(sessions_to_remove)} old file sessions")


@app.post("/upload")
@limiter.limit("50/hour", exempt_when=lambda: IS_LOCAL_DEPLOYMENT)
async def upload_audio(request: Request, file: UploadFile = File(...)):
    """Upload an audio file and return a file_id for processing"""

    # Get user session identifier
    user_id = get_client_identifier(request)

    # Clean up old sessions before processing new upload
    cleanup_old_sessions()

    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)

    # Validate file type
    allowed_extensions = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
    file_ext = Path(safe_filename).suffix.lower()

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

                # Check against absolute maximum first
                if total_size > ABSOLUTE_MAX_FILE_SIZE_BYTES:
                    buffer.close()
                    if file_path.exists():
                        file_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size is {ABSOLUTE_MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB"
                    )
                buffer.write(chunk)

        # Check user quota AFTER knowing final size
        can_upload, error_msg = session_manager.can_upload_file(user_id, total_size)
        if not can_upload:
            # Clean up file
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=429, detail=error_msg)

        # Validate file content matches extension
        is_valid, error_msg = validate_audio_file_content(str(file_path), file_ext)
        if not is_valid:
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=error_msg)

        # Register file with session manager
        session_manager.get_or_create_session(user_id).add_file(file_id, total_size)

    except HTTPException:
        raise
    except Exception as e:
        # Clean up on any error
        if file_path.exists():
            try:
                file_path.unlink()
            except:
                pass
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Store session info
    file_sessions[file_id] = {
        "original_name": safe_filename,
        "file_path": str(file_path),
        "extension": file_ext,
        "uploaded_at": datetime.now(),
        "user_id": user_id,
        "file_size": total_size,
    }

    logger.info(f"File uploaded: {file_id} by {user_id} ({total_size} bytes)")

    return {
        "file_id": file_id,
        "filename": safe_filename,
        "message": "File uploaded successfully"
    }


@app.post("/process")
@limiter.limit("200/hour", exempt_when=lambda: IS_LOCAL_DEPLOYMENT)
async def process_audio(request: Request, body: ProcessRequest):
    """Process audio file with effect chain or preset."""

    # Get user session and check processing quota
    user_id = get_client_identifier(request)
    can_process, error_msg = session_manager.can_process(user_id)
    if not can_process:
        raise HTTPException(status_code=429, detail=error_msg)

    file_id = body.file_id

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
    if body.preset_id:
        try:
            preset = load_preset(body.preset_id)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Preset not found")
        effects_list = preset.get("effects", [])
    else:
        effects_list = [
            {"type": effect.type, "params": effect.params}
            for effect in (body.effects or [])
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
        logger.info(f"Processing audio with {len(effects_list)} effects for user {user_id}")
        logger.debug(f"Input: {input_path}")
        logger.debug(f"Output: {output_path}")

        # Record processing attempt
        session_manager.get_or_create_session(user_id).add_process()

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
        logger.error(f"Error processing audio: {str(e)}")
        # Don't expose detailed error traces in production
        if os.getenv("DEBUG", "").lower() == "true":
            error_details = traceback.format_exc()
            logger.debug(error_details)
            raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail="Processing failed. Please check your file and try again.")


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
async def download_processed(file_id: str, format: Optional[str] = None):
    """Download processed audio file

    Args:
        file_id: The file identifier
        format: Optional output format ('wav', 'mp3', 'flac', 'ogg'). If not specified, uses original format.
    """

    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]

    if "processed_path" not in session:
        raise HTTPException(status_code=400, detail="File not yet processed")

    processed_path = session["processed_path"]

    if not os.path.exists(processed_path):
        raise HTTPException(status_code=404, detail="Processed file not found")

    original_name = Path(session["original_name"]).stem
    original_extension = session["extension"]

    # If format conversion is requested
    if format and format.lower() != original_extension.lstrip('.'):
        from pedalboard.io import AudioFile

        # Validate format
        allowed_formats = {'wav', 'mp3', 'flac', 'ogg'}
        format_lower = format.lower()
        if format_lower not in allowed_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format. Allowed: {', '.join(allowed_formats)}"
            )

        # Create converted file path
        converted_extension = f".{format_lower}"
        converted_filename = f"{file_id}_converted{converted_extension}"
        converted_path = PROCESSED_DIR / converted_filename

        try:
            # Read the processed audio
            with AudioFile(processed_path) as f:
                audio = f.read(f.frames)
                sample_rate = f.samplerate

            # Write in the requested format
            with AudioFile(str(converted_path), 'w', sample_rate, audio.shape[0]) as f:
                f.write(audio)

            download_name = f"{original_name}_processed{converted_extension}"

            # Determine media type
            media_types = {
                'wav': 'audio/wav',
                'mp3': 'audio/mpeg',
                'flac': 'audio/flac',
                'ogg': 'audio/ogg'
            }
            media_type = media_types.get(format_lower, 'audio/mpeg')

            # Return the converted file and clean it up after sending
            return FileResponse(
                str(converted_path),
                media_type=media_type,
                filename=download_name,
                background=lambda: converted_path.unlink(missing_ok=True)
            )

        except Exception as e:
            logger.error(f"Format conversion error: {str(e)}")
            # Clean up partial file if it exists
            if converted_path.exists():
                converted_path.unlink(missing_ok=True)
            raise HTTPException(status_code=500, detail=f"Failed to convert audio format: {str(e)}")

    # Return original format
    download_name = f"{original_name}_processed{original_extension}"

    # Determine media type based on extension
    media_types = {
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.flac': 'audio/flac',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4'
    }
    media_type = media_types.get(original_extension, 'audio/mpeg')

    return FileResponse(
        processed_path,
        media_type=media_type,
        filename=download_name
    )


@app.delete("/cleanup/{file_id}")
async def cleanup_files(file_id: str):
    """Clean up uploaded and processed files"""

    if file_id not in file_sessions:
        raise HTTPException(status_code=404, detail="File not found")

    session = file_sessions[file_id]
    user_id = session.get("user_id")
    file_size = session.get("file_size", 0)

    try:
        if os.path.exists(session["file_path"]):
            os.remove(session["file_path"])
        processed_path = session.get("processed_path")
        if processed_path and os.path.exists(processed_path):
            os.remove(processed_path)

        # Update session manager
        if user_id:
            user_session = session_manager.get_or_create_session(user_id)
            user_session.remove_file(file_id)
            # Adjust byte count
            user_session.total_bytes_uploaded = max(0, user_session.total_bytes_uploaded - file_size)

        del file_sessions[file_id]

        logger.info(f"Files cleaned up: {file_id}")

        return {"message": "Files cleaned up successfully"}

    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Cleanup failed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
