from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/community", tags=["Community"])


# =====================
# Schemas
# =====================

class CreatePostRequest(BaseModel):
    user_id: int
    dish_name: str
    dish_image: str
    opinion: str | None = None


class CommentRequest(BaseModel):
    user_id: int
    comment: str
    parent_id: Optional[int] = None


# =====================
# Create Community Post
# =====================

@router.post("/post")
def create_post(request: CreatePostRequest, db: Session = Depends(get_db)):
    post = models.CommunityPost(
        user_id=request.user_id,
        dish_name=request.dish_name,
        dish_image=request.dish_image,
        opinion=request.opinion
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"message": "Post created", "post_id": post.id}


# =====================
# Get Community Feed
# =====================

@router.get("/posts")
def get_posts(user_id: int | None = None, db: Session = Depends(get_db)):
    # Join with Users to get creator name
    posts = (
        db.query(
            models.CommunityPost,
            models.Users.name.label("user_name")
        )
        .join(models.Users, models.CommunityPost.user_id == models.Users.id)
        .order_by(models.CommunityPost.created_at.desc())
        .all()
    )

    result = []
    for post, user_name in posts:
        likes_count = (
            db.query(models.PostLike)
            .filter(models.PostLike.post_id == post.id)
            .count()
        )
        comments_count = (
            db.query(models.PostComment)
            .filter(models.PostComment.post_id == post.id)
            .count()
        )
        
        is_liked = False
        if user_id:
            user_like = (
                db.query(models.PostLike)
                .filter(
                    models.PostLike.post_id == post.id,
                    models.PostLike.user_id == user_id
                )
                .first()
            )
            is_liked = True if user_like else False

        result.append({
            "id": post.id,
            "dish_name": post.dish_name,
            "dish_image": post.dish_image,
            "opinion": post.opinion,
            "user_id": post.user_id,
            "user_name": user_name or f"User #{post.user_id}",
            "likes": likes_count,
            "is_liked": is_liked,
            "comments": comments_count,
            "created_at": post.created_at,
        })

    return result


# =====================
# Like / Unlike a Post
# =====================

@router.post("/post/{post_id}/like")
def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    # 1. Check if post exists
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # 2. Check if already liked
    exists = (
        db.query(models.PostLike)
        .filter(
            models.PostLike.post_id == post_id,
            models.PostLike.user_id == user_id
        )
        .first()
    )

    if exists:
        return {"message": "Already liked"}

    # 3. Add Like
    like = models.PostLike(post_id=post_id, user_id=user_id)
    db.add(like)
    
    # 4. Create Notification for Post Owner (if not self-like)
    if post.user_id != user_id:
        # Get Liker Name
        liker = db.query(models.Users).filter(models.Users.id == user_id).first()
        liker_name = liker.name if liker else "Someone"
        
        notif = models.Notification(
            user_id=post.user_id,
            type="like",
            title="新しいいいね！",
            message=f"{liker_name}さんがあなたの投稿「{post.dish_name}」にいいねしました",
            related_id=post.id
        )
        db.add(notif)

    db.commit()
    return {"message": "Liked"}


@router.delete("/post/{post_id}/like")
def unlike_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = (
        db.query(models.PostLike)
        .filter(
            models.PostLike.post_id == post_id,
            models.PostLike.user_id == user_id
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unliked"}
    
    raise HTTPException(status_code=404, detail="Like not found")


# =====================
# Trending Posts
# =====================

@router.get("/trending")
def get_trending(db: Session = Depends(get_db)):
    # Get all posts and group by dish_name to avoid duplicates
    posts = db.query(models.CommunityPost).all()
    
    # Group posts by dish_name and aggregate likes
    dish_map = {}  # {dish_name: {"name", "image", "likes", "post_ids"}}
    
    for post in posts:
        dish_name = post.dish_name
        likes_count = db.query(models.PostLike).filter(models.PostLike.post_id == post.id).count()
        
        if dish_name not in dish_map:
            dish_map[dish_name] = {
                "name": dish_name,
                "image": post.dish_image,
                "likes": likes_count,
                "post_ids": [post.id]
            }
        else:
            # Aggregate likes from all posts with same dish name
            dish_map[dish_name]["likes"] += likes_count
            dish_map[dish_name]["post_ids"].append(post.id)
            # Use the image from the post with most likes
            if likes_count > 0 and not dish_map[dish_name]["image"]:
                dish_map[dish_name]["image"] = post.dish_image
    
    # Convert to list and sort by total likes
    trending_list = list(dish_map.values())
    trending_list.sort(key=lambda x: x["likes"], reverse=True)
    
    # Return top 5, with just the first post_id for reference
    result = []
    for item in trending_list[:5]:
        result.append({
            "name": item["name"],
            "image": item["image"],
            "likes": item["likes"],
            "id": item["post_ids"][0]  # Use first post id
        })
    
    return result


# =====================
# Notifications
# =====================

@router.get("/notifications/{user_id}")
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    notifs = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return notifs

@router.post("/notifications/{notif_id}/read")
def read_notification(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
         raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.read = 1
    db.commit()
    return {"status": "ok"}



# =====================
# Comment on a Post
# =====================

@router.post("/post/{post_id}/comment")
def comment_post(
    post_id: int,
    request: CommentRequest,
    db: Session = Depends(get_db)
):
    comment = models.PostComment(
        post_id=post_id,
        user_id=request.user_id,
        comment=request.comment,
        parent_id=request.parent_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # 通知ロジック
    post = db.query(models.CommunityPost).filter(models.CommunityPost.id == post_id).first()
    sender = db.query(models.Users).filter(models.Users.id == request.user_id).first()
    sender_name = sender.username if sender else "誰か"

    notif_recipient_id = None
    notif_type = "comment"
    notif_message = ""

    if request.parent_id:
        # 返信の場合
        parent_comment = db.query(models.PostComment).filter(models.PostComment.id == request.parent_id).first()
        if parent_comment and parent_comment.user_id != request.user_id:
            notif_recipient_id = parent_comment.user_id
            notif_type = "reply"
            notif_message = f"{sender_name}さんがあなたのコメントに返信しました: {request.comment[:20]}"
    elif post and post.user_id != request.user_id:
        # 通常コメントの場合
        notif_recipient_id = post.user_id
        notif_type = "comment"
        notif_message = f"{sender_name}さんがあなたの投稿にコメントしました: {request.comment[:20]}"
    
    if notif_recipient_id:
        notif = models.Notification(
            user_id=notif_recipient_id,
            type=notif_type,
            title="返信がありました" if notif_type == "reply" else "コメントがありました",
            message=notif_message,
            related_id=post_id
        )
        db.add(notif)
        db.commit()

    return {"message": "Comment added", "comment_id": comment.id}


@router.get("/post/{post_id}/comments")
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(
            models.PostComment,
            models.Users.name.label("user_name")
        )
        .join(models.Users, models.PostComment.user_id == models.Users.id)
        .filter(models.PostComment.post_id == post_id)
        .order_by(models.PostComment.created_at.asc())
        .all()
    )

    result = []
    for comment, user_name in comments:
        result.append({
            "id": comment.id,
            "post_id": comment.post_id,
            "user_id": comment.user_id,
            "user_name": user_name or f"User #{comment.user_id}",
            "comment": comment.comment,
            "created_at": comment.created_at,
            "parent_id": comment.parent_id
        })
    
    return result
