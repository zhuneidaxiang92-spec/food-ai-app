from database import engine
from sqlalchemy import text

def add_column():
    try:
        with engine.connect() as conn:
            # 1. users table: profile_image
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(500) NULL;"))
                conn.commit()
                print("✅ Successfully added profile_image column")
            except Exception as e:
                print(f"ℹ️ profile_image check: {e}")

            # 2. post_comments table: parent_id
            try:
                conn.execute(text("ALTER TABLE post_comments ADD COLUMN parent_id INT NULL;"))
                conn.commit()
                print("✅ Successfully added parent_id column")
            except Exception as e:
                print(f"ℹ️ parent_id check: {e}")

    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    add_column()
