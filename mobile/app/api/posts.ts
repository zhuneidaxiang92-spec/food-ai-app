import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "../../constants/config";
import type {
  CommunityPost,
  CreatePostRequest,
  Comment,
  CreateCommentRequest,
} from "../../types/types";

const BASE_URL = getApiUrl();

// ==============================================
// Helper: Get logged-in user
// ==============================================

export async function getUserId(): Promise<number> {
  const stored = await AsyncStorage.getItem("user");
  if (!stored) throw new Error("User not logged in");
  const user = JSON.parse(stored);
  return user.id;
}

// ==============================================
// Community Posts API
// ==============================================

/**
 * Get all community posts
 */
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const userId = await getUserId();
    const res = await axios.get(`${BASE_URL}/api/community/posts?user_id=${userId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw error;
  }
}

/**
 * Create a new community post
 */
export async function createCommunityPost(
  dish_name: string,
  dish_image: string,
  opinion?: string
): Promise<{ message: string; post_id: number }> {
  try {
    const userId = await getUserId();
    const data: CreatePostRequest = {
      user_id: userId,
      dish_name,
      dish_image,
      opinion,
    };
    const res = await axios.post(`${BASE_URL}/api/community/post`, data);
    return res.data;
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
}

/**
 * Like a post
 */
export async function likePost(postId: number): Promise<{ message: string }> {
  try {
    const userId = await getUserId();
    const res = await axios.post(
      `${BASE_URL}/api/community/post/${postId}/like?user_id=${userId}`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to like post:", error);
    throw error;
  }
}

/**
 * Unlike a post
 */
export async function unlikePost(postId: number): Promise<{ message: string }> {
  try {
    const userId = await getUserId();
    const res = await axios.delete(
      `${BASE_URL}/api/community/post/${postId}/like?user_id=${userId}`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to unlike post:", error);
    throw error;
  }
}

// ==============================================
// Comments API
// ==============================================

/**
 * Get comments for a post
 */
export async function getPostComments(postId: number): Promise<Comment[]> {
  try {
    const res = await axios.get(`${BASE_URL}/api/community/post/${postId}/comments`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    throw error;
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(
  postId: number,
  comment: string,
  parentId?: number
): Promise<{ message: string; comment_id: number }> {
  try {
    const userId = await getUserId();
    const data: CreateCommentRequest = {
      user_id: userId,
      comment,
      parent_id: parentId,
    };
    const res = await axios.post(
      `${BASE_URL}/api/community/post/${postId}/comment`,
      data
    );
    return res.data;
  } catch (error) {
    console.error("Failed to add comment:", error);
    throw error;
  }
}

// ==============================================
// Trending API
// ==============================================

/**
 * Get trending dishes
 */
export async function getTrendingDishes(): Promise<
  Array<{ name: string; image: string; likes: number; id: number }>
> {
  try {
    const res = await axios.get(`${BASE_URL}/api/community/trending`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch trending:", error);
    throw error;
  }
}

// ==============================================
// Notifications API
// ==============================================

/**
 * Get user notifications
 */
export async function getNotifications() {
  try {
    const userId = await getUserId();
    const res = await axios.get(`${BASE_URL}/api/community/notifications/${userId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notifId: number) {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/community/notifications/${notifId}/read`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}
