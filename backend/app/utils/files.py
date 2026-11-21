"""
File upload validation and storage.
JPG/PNG only, max 5 MB, stored under backend/uploads/ with random UUID.
Optional Cloudinary upload if credentials are provided.
"""
import os
import uuid
import aiofiles
from fastapi import HTTPException, UploadFile
from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}


async def save_upload_file(file: UploadFile) -> str:
    """
    Validates and saves uploaded image file.
    Returns relative filepath under uploads/ (or Cloudinary secure_url).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file missing filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file extension {ext}. Allowed: .jpg, .jpeg, .png")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid MIME type {file.content_type}. Allowed: image/jpeg, image/png")

    # Read content
    content = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB")

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    rel_path = os.path.join(settings.UPLOAD_DIR, filename)

    async with aiofiles.open(rel_path, "wb") as f:
        await f.write(content)

    # Optional Cloudinary upload
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            upload_result = cloudinary.uploader.upload(
                rel_path,
                public_id=f"smartsignal_{uuid.uuid4().hex[:8]}",
                folder="smartsignal_vehicles",
            )
            if "secure_url" in upload_result:
                return upload_result["secure_url"]
        except Exception:
            pass

    return rel_path.replace("\\", "/")
