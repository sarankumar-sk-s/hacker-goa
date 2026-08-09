import os
import uuid
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from typing import Dict
from app.models.schemas import (
    UploadResponse,
    GenerateFrameRequest,
    GenerateBuilderCardRequest,
    GenerationResponse,
    ShareRequest,
    ShareResponse
)
from app.services.image_processor import image_processor_service

router = APIRouter()

# Paths relative to execution directory
STATIC_DIR = os.path.join(os.getcwd(), "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
GENERATED_DIR = os.path.join(STATIC_DIR, "generated")


@router.post("/upload", response_model=UploadResponse, tags=["Generator"])
async def upload_avatar(file: UploadFile = File(..., description="Raw avatar image file")):
    """
    Upload an avatar image to the server.
    Saves the file to disk and returns a unique file ID and retrieval URL.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image type."
        )

    try:
        # Generate a unique identifier
        image_id = str(uuid.uuid4())
        filename = f"{image_id}.png"
        file_path = os.path.join(UPLOADS_DIR, filename)

        # Write file bytes to disk
        contents = await file.read()
        
        # Verify it loads as an image in PIL
        from PIL import Image
        import io
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format."
            )

        # Save to disk as PNG
        with open(file_path, "wb") as f:
            f.write(contents)

        download_url = f"/api/v1/download/{image_id}"
        return UploadResponse(id=image_id, url=download_url)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {str(e)}"
        )


@router.post("/generate-frame", response_model=GenerationResponse, tags=["Generator"])
async def generate_profile_frame(config: GenerateFrameRequest):
    """
    Crop the uploaded avatar image, center it within a circular cutout, 
    and overlay the premium 3D cyberpunk shield event badge.
    """
    upload_path = os.path.join(UPLOADS_DIR, f"{config.image_id}.png")
    
    # Verify file exists
    if not os.path.exists(upload_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar image ID not found."
        )

    try:
        with open(upload_path, "rb") as f:
            raw_bytes = f.read()

        # Run Pillow & OpenCV overlay pipeline
        result_bytes = image_processor_service.apply_profile_frame(raw_bytes, config)

        # Save to generated assets folder
        generated_id = str(uuid.uuid4())
        generated_path = os.path.join(GENERATED_DIR, f"{generated_id}.png")
        
        with open(generated_path, "wb") as f:
            f.write(result_bytes)

        # Build base64 representation
        encoded_img = base64.b64encode(result_bytes).decode("utf-8")
        image_base64 = f"data:image/png;base64,{encoded_img}"

        download_url = f"/api/v1/download/{generated_id}"
        return GenerationResponse(
            id=generated_id,
            url=download_url,
            image_base64=image_base64
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate frame overlay: {str(e)}"
        )


@router.post("/generate-builder-card", response_model=GenerationResponse, tags=["Generator"])
async def generate_builder_card(config: GenerateBuilderCardRequest):
    """
    Generates a premium 3D Cyberpunk Builder ID Card in Python, 
    drawing theme details, standard avatar crop, coordinates, and barcode.
    """
    upload_path = os.path.join(UPLOADS_DIR, f"{config.image_id}.png")
    
    # Verify file exists
    if not os.path.exists(upload_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar image ID not found."
        )

    try:
        with open(upload_path, "rb") as f:
            raw_bytes = f.read()

        # Run Pillow & OpenCV ID Card drawing
        result_bytes = image_processor_service.generate_id_card(raw_bytes, config)

        # Save to generated assets folder
        generated_id = str(uuid.uuid4())
        generated_path = os.path.join(GENERATED_DIR, f"{generated_id}.png")
        
        with open(generated_path, "wb") as f:
            f.write(result_bytes)

        # Build base64 representation
        encoded_img = base64.b64encode(result_bytes).decode("utf-8")
        image_base64 = f"data:image/png;base64,{encoded_img}"

        download_url = f"/api/v1/download/{generated_id}"
        return GenerationResponse(
            id=generated_id,
            url=download_url,
            image_base64=image_base64
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Builder Card: {str(e)}"
        )


@router.get("/download/{id}", tags=["Generator"])
async def download_file(id: str):
    """
    Download a generated badge/card or an uploaded avatar by unique image ID.
    Supports transparent PNG downloads and caches headers correctly.
    """
    # 1. Search in generated folder
    generated_path = os.path.join(GENERATED_DIR, f"{id}.png")
    if os.path.exists(generated_path):
        return FileResponse(
            path=generated_path,
            media_type="image/png",
            filename=f"HH_Goa_Asset_{id}.png"
        )

    # 2. Search in uploads folder
    upload_path = os.path.join(UPLOADS_DIR, f"{id}.png")
    if os.path.exists(upload_path):
        return FileResponse(
            path=upload_path,
            media_type="image/png",
            filename=f"HH_Goa_Avatar_{id}.png"
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Image ID not found."
    )


@router.post("/share", response_model=ShareResponse, tags=["Generator"])
async def register_share(config: ShareRequest):
    """
    Register shared assets.
    Returns a shareable URL to download or view the generated asset.
    """
    # Verify the image ID exists in the generated outputs folder
    generated_path = os.path.join(GENERATED_DIR, f"{config.image_id}.png")
    if not os.path.exists(generated_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated asset ID not found to register for sharing."
        )

    share_id = str(uuid.uuid4())
    # The direct image download link is returned as the primary shareable resource URL
    share_url = f"/api/v1/download/{config.image_id}"
    
    return ShareResponse(share_id=share_id, share_url=share_url)
