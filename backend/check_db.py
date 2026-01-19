from backend.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('users')

print("Users table columns:")
print("-" * 50)
for col in columns:
    print(f"  {col['name']:20} {str(col['type']):20} nullable={col['nullable']}")

print("\nChecking for profile_image column...")
has_profile_image = any(col['name'] == 'profile_image' for col in columns)
print(f"profile_image exists: {has_profile_image}")

if has_profile_image:
    profile_col = [c for c in columns if c['name'] == 'profile_image'][0]
    print(f"  Type: {profile_col['type']}")
    print(f"  Nullable: {profile_col['nullable']}")
