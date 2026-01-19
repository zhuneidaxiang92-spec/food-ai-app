from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import os
import shutil
from pathlib import Path
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/users", tags=["Users"])

# Upload directory for profile images
UPLOAD_DIR = Path("backend/uploads/profiles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# =====================
# Schemas
# =====================

class UserProfileResponse(BaseModel):
    id: int
    name: str | None
    email: str
    profile_image: str | None
    created_at: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# =====================
# Get User Profile
# =====================

@router.get("/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # profile_imageカラムが存在しない場合でもエラーにならないようにする
    profile_image = getattr(user, 'profile_image', None)
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "profile_image": profile_image,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }



# =====================
# Update User Profile
# =====================

@router.put("/{user_id}")
def update_profile(
    user_id: int,
    request: UpdateProfileRequest,
    db: Session = Depends(get_db)
):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update name if provided
    if request.name is not None:
        user.name = request.name
    
    # Update email if provided (check for uniqueness)
    if request.email is not None:
        # Check if email is already taken by another user
        existing = db.query(models.Users).filter(
            models.Users.email == request.email,
            models.Users.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = request.email
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_image": user.profile_image,
        }
    }


# =====================
# Upload Profile Image
# =====================

@router.post("/{user_id}/profile-image")
async def upload_profile_image(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file type
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")
    
    # Create unique filename
    filename = f"user_{user_id}_{int(os.times().system * 1000)}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Delete old profile image if exists
    if user.profile_image:
        old_file = UPLOAD_DIR / os.path.basename(user.profile_image)
        if old_file.exists():
            old_file.unlink()
    
    # Save new file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user profile_image path
    # Store as relative URL path
    image_url = f"/uploads/profiles/{filename}"
    user.profile_image = image_url
    db.commit()
    
    return {
        "message": "Profile image uploaded successfully",
        "profile_image": image_url
    }


# =====================
# Change Password
# =====================

@router.put("/{user_id}/password")
def change_password(
    user_id: int,
    request: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not user.password_hash:
        raise HTTPException(status_code=400, detail="Cannot change password for OAuth users")
    
    if not bcrypt.checkpw(request.current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash and update new password
    new_hash = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt())
    user.password_hash = new_hash.decode('utf-8')
    
    db.commit()
    
    return {"message": "Password changed successfully"}


# =====================
# Delete Account
# =====================

@router.delete("/{user_id}")
def delete_account(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete profile image if exists
    if user.profile_image:
        file_path = UPLOAD_DIR / os.path.basename(user.profile_image)
        if file_path.exists():
            file_path.unlink()
    
    # Delete related data
    # 1. Delete user's posts
    user_posts = db.query(models.CommunityPost).filter(models.CommunityPost.user_id == user_id).all()
    for post in user_posts:
        # Delete likes on this post
        db.query(models.PostLike).filter(models.PostLike.post_id == post.id).delete()
        # Delete comments on this post
        db.query(models.PostComment).filter(models.PostComment.post_id == post.id).delete()
        # Delete the post
        db.delete(post)
    
    # 2. Delete user's likes on other posts
    db.query(models.PostLike).filter(models.PostLike.user_id == user_id).delete()
    
    # 3. Delete user's comments on other posts
    db.query(models.PostComment).filter(models.PostComment.user_id == user_id).delete()
    
    # 4. Delete user's notifications
    db.query(models.Notification).filter(models.Notification.user_id == user_id).delete()
    
    # 5. Delete user's recommendations
    db.query(models.Recommendations).filter(models.Recommendations.user_id == user_id).delete()
    
    # Finally, delete the user
    db.delete(user)
    db.commit()
    
    return {"message": "Account deleted successfully"}
