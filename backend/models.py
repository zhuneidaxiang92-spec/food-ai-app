from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base


# =========================
# Users
# =========================

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Google login fields
    google_id = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)

    # Email login
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    
    # Profile
    profile_image = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# =========================
# Recommendations
# =========================

class Recommendations(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    recipe_name = Column(String(255), nullable=False)
    image_url = Column(String(500))
    reason = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =========================
# Community Posts
# =========================

class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    dish_name = Column(String(255), nullable=False)
    dish_image = Column(Text, nullable=False)
    opinion = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =========================
# Post Likes
# =========================

class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)


# =========================
# Post Comments
# =========================

class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 返信機能用 (自己参照)
    parent_id = Column(Integer, ForeignKey("post_comments.id"), nullable=True)


# =========================
# Notifications
# =========================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # type: like, comment, system
    type = Column(String(50), nullable=False)
    title = Column(String(255))
    message = Column(String(500))
    
    # Optional link to related content (e.g., post id)
    related_id = Column(Integer, nullable=True)
    
    read = Column(Integer, default=0) # 0: unread, 1: read
    created_at = Column(DateTime(timezone=True), server_default=func.now())
