from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_uri: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str

    sendgrid_api_key: str = ""
    from_email: str = "noreply@strayrescue.in"

    yolo_model_path: str = "models/yolov8m_stray.pt"
    effnet_model_path: str = "models/effnetv2s_injury.pt"

    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
