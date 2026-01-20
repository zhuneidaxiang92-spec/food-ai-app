import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import { getPostComments, addComment } from "../api/posts";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTextSize } from "../../context/TextSizeContext";
import { Colors } from "../../constants/colors";
import GlobalWrapper from "../../components/GlobalWrapper";
import GlassCard from "../../components/GlassCard";
import type { Comment, CommunityPost } from "../../types/types";

export default function CommentsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { post }: { post: CommunityPost } = route.params;

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { t } = useLanguage();
  const { fontSize } = useTextSize();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getPostComments(post.id);
      setComments(data);
    } catch (error) {
      console.error("Failed to load comments:", error);
      Alert.alert(t("common_error"), t("community_comment_error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) {
      Alert.alert(t("common_error"), t("community_empty_comment"));
      return;
    }

    try {
      setPosting(true);
      await addComment(post.id, commentText.trim());
      setCommentText("");
      await loadComments(); // Reload comments
    } catch (error) {
      console.error("Failed to post comment:", error);
      Alert.alert(t("common_error"), t("community_comment_error"));
    } finally {
      setPosting(false);
    }
  };

  return (
    <GlobalWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
              {t("community_comments")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtext, fontSize: fontSize - 2 }]}>
              {post.dish_name}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Comments List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : comments.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="chatbubble-outline" size={48} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext, fontSize: fontSize + 1 }]}>
                {t("community_no_comments")}
              </Text>
              <Text style={[styles.emptyHint, { color: theme.subtext, fontSize }]}>
                {t("community_be_first")}
              </Text>
            </GlassCard>
          ) : (
            comments.map((comment) => (
              <GlassCard key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>
                      {comment.user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentInfo}>
                    <Text style={[styles.commentUser, { color: theme.text, fontSize }]}>
                      {comment.user_name}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.subtext, fontSize: fontSize - 3 }]}>
                      {formatTimestamp(comment.created_at)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.commentText, { color: theme.text, fontSize }]}>
                  {comment.comment}
                </Text>
              </GlassCard>
            ))
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
                fontSize,
              },
            ]}
            placeholder={t("community_comment_placeholder")}
            placeholderTextColor={theme.subtext}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: commentText.trim() ? theme.primary : theme.border },
            ]}
            onPress={handlePostComment}
            disabled={posting || !commentText.trim()}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GlobalWrapper>
  );
}

// Helper: Format timestamp
function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const commentDate = new Date(timestamp);
  const diffMs = now.getTime() - commentDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`;
  return `${Math.floor(diffMins / 1440)}日前`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  headerSubtitle: {
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyText: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: "center",
  },
  commentCard: {
    marginBottom: 12,
    padding: 16,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  commentInfo: {
    flex: 1,
  },
  commentUser: {
    fontWeight: "600",
  },
  commentTime: {
    marginTop: 2,
  },
  commentText: {
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
