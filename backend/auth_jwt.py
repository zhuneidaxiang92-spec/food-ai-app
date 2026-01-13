from jose import jwt
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day


def _require_secret() -> str:
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET is not set in environment (.env)")
    return SECRET_KEY


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    """
    JWT アクセストークンを生成して返す
    - data: payload（例: {"sub": "1"}）
    - expires_minutes: 有効期限（分）。指定がなければデフォルト
    """
    if not isinstance(data, dict):
        raise ValueError("data must be a dict")

    to_encode = data.copy()
    minutes = expires_minutes if expires_minutes is not None else ACCESS_TOKEN_EXPIRE_MINUTES

    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, _require_secret(), algorithm=ALGORITHM)
