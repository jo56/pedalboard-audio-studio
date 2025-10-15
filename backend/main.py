from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import uuid
import shutil
from pathlib import Path
from effects import apply_effects_chain, get_available_effects

app = FastAPI(title="Pedalboard Audio Processor API")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories for file storage
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# In-memory storage for file sessions
file_sessions = {}

class EffectConfig(BaseModel):
    type: str
    params: Dict[str, Any]

class ProcessRequest(BaseModel):
    file_id: str
    effects: List[EffectConfig]

@app.get("/")
async def root():
    return {"message": "Pedalboard Audio Processor API", "status": "running"}

@app.get("/effects")
async def list_effects():
    """Get list of available audio effects with their parameters"""
    return get_available_effects()

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file and return a file_id for processing"""

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

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Store session info
    file_sessions[file_id] = {
        "original_name": file.filename,
        "file_path": str(file_path),
        "extension": file_ext
    }

    return {
        "file_id": file_id,
        "filename": file.filename,
        "message": "File uploaded successfully"
    }

@app.post("/process")
async def process_audio(request: ProcessRequest):
    """Process audio file with effect chain"""

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

    # Generate output path
    output_filename = f"{file_id}_processed{extension}"
    output_path = PROCESSED_DIR / output_filename

    try:
        # Convert effects to dict format
        effects_list = [{"type": e.type, "params": e.params} for e in request.effects]
        print(f"Processing audio with {len(effects_list)} effects")
        print(f"Input: {input_path}")
        print(f"Output: {output_path}")

        # Apply effects chain
        apply_effects_chain(
            input_path=input_path,
            output_path=str(output_path),
            effects=effects_list
        )

        # Verify output file was created
        if not os.path.exists(str(output_path)):
            raise Exception("Output file was not created successfully")

        # Store processed file info
        file_sessions[file_id]["processed_path"] = str(output_path)

        print(f"Processing completed successfully")

        return {
            "file_id": file_id,
            "processed": True,
            "message": "Audio processed successfully",
            "download_url": f"/download/{file_id}"
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing audio: {str(e)}")
        print(error_details)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

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

    # Remove files
    try:
        if os.path.exists(session["file_path"]):
            os.remove(session["file_path"])
        if "processed_path" in session and os.path.exists(session["processed_path"]):
            os.remove(session["processed_path"])

        del file_sessions[file_id]

        return {"message": "Files cleaned up successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
