import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { likePost, unlikePost } from "../api/posts";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTextSize } from "../../context/TextSizeContext";
import { Colors } from "../../constants/colors";
import GlassCard from "../../components/GlassCard";
import type { CommunityPost } from "../../types/types";

interface FeedPostProps {
  post: CommunityPost;
  onLikeToggle?: () => void; // Callback to refresh feed
}

export default function FeedPost({ post, onLikeToggle }: FeedPostProps) {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { t } = useLanguage();
  const { fontSize } = useTextSize();

  // Local state for optimistic UI
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeToggle = async () => {
    if (isLiking) return;

    // Optimistic UI update
    const wasLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? previousCount - 1 : previousCount + 1);
    setIsLiking(true);

    try {
      if (wasLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      // Success - optimistic update was correct
      if (onLikeToggle) onLikeToggle();
    } catch (error) {
      // Revert on error
      console.error("Like toggle failed:", error);
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      Alert.alert(t("common_error"), t("community_like_error"));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.dish_name}${post.opinion ? `\n\n${post.opinion}` : ""}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleCommentPress = () => {
    navigation.navigate("Comments", { post });
  };

  return (
    <GlassCard style={styles.card}>
      {/* User Info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {post.user_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: theme.text, fontSize }]}>
              {post.user_name}
            </Text>
            <Text style={[styles.timestamp, { color: theme.subtext, fontSize: fontSize - 2 }]}>
              {formatTimestamp(post.created_at)}
            </Text>
          </View>
        </View>
      </View>

      {/* Dish Image */}
      <Image
        source={{ uri: post.dish_image }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Dish Info */}
      <View style={styles.content}>
        <Text style={[styles.dishName, { color: theme.text, fontSize: fontSize + 2 }]}>
          {post.dish_name}
        </Text>
        {post.opinion && (
          <Text style={[styles.opinion, { color: theme.subtext, fontSize }]}>
            {post.opinion}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          {/* Like Button */}
          <TouchableOpacity
            onPress={handleLikeToggle}
            disabled={isLiking}
            style={styles.actionButton}
          >
            {isLiking ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={26}
                color={isLiked ? "#FF3B30" : theme.text}
              />
            )}
            <Text
              style={[
                styles.actionText,
                { color: isLiked ? "#FF3B30" : theme.subtext, fontSize: fontSize - 2 },
              ]}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity onPress={handleCommentPress} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.subtext, fontSize: fontSize - 2 }]}>
              {post.comments}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

// Helper: Format timestamp
function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`;
  return `${Math.floor(diffMins / 1440)}日前`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  userName: {
    fontWeight: "600",
  },
  timestamp: {
    marginTop: 2,
  },
  image: {
    width: "100%",
    height: 300,
  },
  content: {
    padding: 16,
  },
  dishName: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  opinion: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leftActions: {
    flexDirection: "row",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontWeight: "600",
  },
});
