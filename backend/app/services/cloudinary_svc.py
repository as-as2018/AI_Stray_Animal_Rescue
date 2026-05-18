import cloudinary
import cloudinary.uploader
from app.config import get_settings


def init_cloudinary():
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def upload_image(image_bytes: bytes, report_id: str) -> dict:
    """Upload image bytes to Cloudinary. Returns image_url and thumbnail_url."""
    init_cloudinary()
    try:
        result = cloudinary.uploader.upload(
            image_bytes,
            folder="stray_rescue/reports",
            public_id=report_id,
            resource_type="image",
            transformation=[{"quality": "auto", "fetch_format": "auto"}],
            eager=[{"width": 300, "height": 300, "crop": "fill", "quality": "auto"}],
        )
        image_url = result.get("secure_url", "")
        # Thumbnail from eager transformation
        thumbnail_url = result.get("eager", [{}])[0].get("secure_url", image_url)
        return {"image_url": image_url, "thumbnail_url": thumbnail_url}
    except Exception as e:
        raise RuntimeError(f"Cloudinary upload failed: {e}")
