from passlib.context import CryptContext

# bcrypt を使用（推奨）
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    平文パスワードを bcrypt でハッシュ化して返す
    """
    if password is None:
        raise ValueError("password is required")

    # bcrypt は 72 文字制限があるため丸める
    if len(password) > 72:
        password = password[:72]

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    平文パスワードとハッシュを照合して True/False を返す
    """
    if plain_password is None or hashed_password is None:
        return False

    if len(plain_password) > 72:
        plain_password = plain_password[:72]

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # ハッシュ形式が壊れている等でも落とさず False
        return False
