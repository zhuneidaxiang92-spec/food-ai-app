from database import engine
from sqlalchemy import text

def add_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(500) NULL;"))
            conn.commit()
            print("✅ Successfully added profile_image column")
    except Exception as e:
        print(f"⚠️ Could not add column (it might already exist): {e}")

if __name__ == "__main__":
    add_column()
