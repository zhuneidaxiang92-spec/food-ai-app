import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import { getApiUrl } from "../constants/config";
import GlobalWrapper from "../components/GlobalWrapper";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import HeroHeader from "../components/HeroHeader";
import PulseCard from "../components/PulseCard";
import NotificationCenter, { Notification } from "../components/NotificationCenter";
import TrendingCard from "../components/TrendingCard";

const API_URL = getApiUrl();
const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const { fontSize } = useTextSize();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  // Safe fallback if Colors structure changed, but we updated it
  const theme = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [foods, setFoods] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  // 返信機能用
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [replyToUserName, setReplyToUserName] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // 通知システム
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // トレンドデータ
  const [trendingFoods, setTrendingFoods] = useState<any[]>([]);

  // プロフィール画像
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadRecommendations(),
      loadCommunityFeed(),
      loadNotifications(),
      loadTrending(),
      loadProfileImage(),
    ]);
    setRefreshing(false);
  };

  // コメントモーダルを閉じる時に返信状態をリセット
  const closeCommentModal = () => {
    setCommentVisible(false);
    setSelectedParentId(null);
    setReplyToUserName(null);
    setCommentText("");
  };

  useEffect(() => {
    loadRecommendations();
    loadCommunityFeed();
    loadNotifications();
    loadTrending();
    loadProfileImage();
  }, []);

  // 画面にフォーカスした時にプロフィール画像を再読み込み
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileImage();
      loadCommunityFeed(); // Refresh feed on return
    });
    return unsubscribe;
  }, [navigation]);

  const loadTrending = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/trending`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrendingFoods(data);
      }
    } catch (e) {
      console.log("ERROR loading trending:", e);
    }
  };

  // プロフィール画像を取得
  const loadProfileImage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      const res = await fetch(`${API_URL}/api/users/${user.id}`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.profile_image) {
        setProfileImageUrl(`${API_URL}${data.profile_image}`);
      }
    } catch (e) {
      console.log("Error loading profile image:", e);
    }
  };

  const loadRecommendations = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return setLoading(false);

      const user = JSON.parse(storedUser);
      if (!user.name) return setLoading(false);

      const res = await fetch(`${API_URL}/recommendations/name/${user.name}`);
      const data = await res.json();
      if (data.items) setFoods(data.items);
    } catch (e) {
      console.log("ERROR loading recommendations:", e);
    }
    setLoading(false);
  };

  const loadCommunityFeed = async () => {
    try {
      let url = `${API_URL}/api/community/posts`;
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        url += `?user_id=${user.id}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCommunityPosts(data);
      } else {
        setCommunityPosts([]);
      }
    } catch (e) {
      console.log("ERROR loading community feed:", e);
      setCommunityPosts([]);
    }
    setLoadingCommunity(false);
  };

  const loadComments = async (postId: number) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_URL}/api/community/post/${postId}/comments`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPostComments(data);
      }
    } catch (e) {
      console.log("Error loading comments:", e);
    }
    setLoadingComments(false);
  };

  const addToFavorites = async (post: any) => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      let favorites = stored ? JSON.parse(stored) : [];

      // Check if already exists
      const exists = favorites.some((f: any) => f.name_jp === post.dish_name);
      if (!exists) {
        favorites.push({
          name_jp: post.dish_name,
          image: post.dish_image,
          id: post.id,
          description: post.opinion // 簡易的な説明として
        });
        await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
      }
    } catch (e) {
      console.log("Error adding to favorites", e);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("time_just_now");
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t("time_min_ago")}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t("time_hr_ago")}`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}${t("time_day_ago")}`;
    return date.toLocaleDateString();
  };

  const loadNotifications = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      const res = await fetch(`${API_URL}/api/community/notifications/${user.id}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        // Map API response to Component format if needed, assuming direct mapping for now
        // Notification component expects: id, type, userId, userName, message, timestamp, read
        // API returns: id, user_id, type, title, message, related_id, read, created_at
        const formatted = data.map((n: any) => ({
          id: n.id.toString(),
          type: n.type,
          userId: 0, // Not needed for display usually
          userName: "System", // Or fetch sender name
          message: n.message,
          timestamp: new Date(n.created_at).getTime(),
          read: n.read === 1
        }));
        setNotifications(formatted);
        setUnreadCount(formatted.filter((n: any) => !n.read).length);
      }
    } catch (e) {
      console.log("ERROR loading notifications:", e);
    }
  };



  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/community/notifications/${id}/read`, { method: "POST" });

      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.read).length);
    } catch (e) {
      console.log("Error marking as read", e);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.read).length);
    await AsyncStorage.setItem("notifications", JSON.stringify(updated));
  };

  const openRecipe = (foodName: string) => {
    if (!foodName) return;
    navigation.navigate("Recipe", { recipeName: foodName });
  };

  const likePost = async (postId: number, isLiked: boolean) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // Optimistic update
      setCommunityPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            is_liked: !isLiked
          };
        }
        return p;
      }));

      const method = isLiked ? "DELETE" : "POST";
      await fetch(`${API_URL}/api/community/post/${postId}/like?user_id=${user.id}`, {
        method: method,
      });

      // いいね！した時に自動でお気に入り追加
      if (!isLiked) {
        // Find post data to save
        const targetPost = communityPosts.find(p => p.id === postId);
        if (targetPost) {
          addToFavorites(targetPost);
        }
      }

      // No need to reload feed if optimistic update works, but better to sync eventually
      // loadCommunityFeed(); 
    } catch {
      Alert.alert("エラー", "いいねの更新に失敗しました");
      loadCommunityFeed(); // Revert on error
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser || !selectedPostId) return;
      const user = JSON.parse(storedUser);

      await fetch(`${API_URL}/api/community/post/${selectedPostId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          comment: commentText,
          parent_id: selectedParentId
        }),
      });

      setCommentText("");
      setSelectedParentId(null);
      setReplyToUserName(null);
      // Don't close modal, just refresh comments
      loadComments(selectedPostId);
      loadCommunityFeed(); // Update comment count on feed
    } catch {
      Alert.alert("エラー", "コメント送信に失敗しました");
    }
  };

  if (loading) {
    return (
      <GlobalWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </GlobalWrapper>
    );
  }

  return (
    <GlobalWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Hero Header */}
        <HeroHeader
          greeting={t("home_welcome")}
          subtitle={t("home_subtitle")}
          notificationCount={unreadCount}
          onNotificationPress={() => setNotificationVisible(true)}
          profileImageUrl={profileImageUrl}
        />

        {/* Trending Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("home_trending")}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {trendingFoods.map((food, index) => (
            <TrendingCard
              key={index}
              rank={index + 1}
              name={food.name}
              image={food.image}
              onPress={() => openRecipe(food.name)}
              delay={index * 80}
            />
          ))}
        </ScrollView>

        {/* Search Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("home_search_heading")}
          </Text>
        </View>
        <View style={styles.searchSection}>
          <View style={styles.compactSearchCard}>
            <AnimatedButton
              title={t("home_search_action")}
              onPress={() => navigation.navigate("Search")}
              icon="search-outline"
              primary={true}
            />
          </View>
        </View>


        {/* Community Feed */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("home_community")}
          </Text>
        </View>

        {loadingCommunity ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <View>
            {communityPosts.length === 0 ? (
              <GlassCard style={styles.emptyBox}>
                <Ionicons name="people-outline" size={48} color={theme.primary} />
                <Text style={[styles.noResults, { fontSize: fontSize + 1, color: theme.text, fontWeight: "600" }]}>
                  {t("home_no_posts")}
                </Text>
              </GlassCard>
            ) : (
              communityPosts.map((post, index) => (
                <GlassCard
                  key={post.id}
                  style={styles.feedCard}
                  delay={index * 100 + 400} // Start after recommendations
                >
                  <View style={styles.feedHeader}>
                    <View style={[styles.avatar, { backgroundColor: theme.border }]}>
                      <Ionicons name="person" size={20} color={theme.subtext} />
                    </View>
                    <View>
                      <Text style={[styles.feedUser, { color: theme.text, fontSize }]}>
                        {post.user_name || `User #${post.user_id}`}
                      </Text>
                      <Text style={[styles.feedTime, { color: theme.subtext, fontSize: fontSize - 2 }]}>
                        {formatTimeAgo(post.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Check for valid image url length to avoid empty space for dummy text */}
                  {post.dish_image && post.dish_image.length > 5 && (
                    <TouchableOpacity onPress={() => openRecipe(post.dish_name)}>
                      <Image source={{ uri: post.dish_image }} style={styles.feedImage} />
                    </TouchableOpacity>
                  )}

                  <View style={styles.feedContent}>
                    <Text style={[styles.feedTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                      {post.dish_name}
                    </Text>
                    {post.opinion && (
                      <Text style={[styles.feedText, { color: theme.text, fontSize }]}>
                        {post.opinion}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.feedActions, { borderColor: theme.border }]}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => likePost(post.id, post.is_liked)}
                    >
                      <Ionicons
                        name={post.is_liked ? "heart" : "heart-outline"}
                        size={20}
                        color={post.is_liked ? "#FF6B9D" : theme.primary}
                      />
                      <Text style={[styles.actionText, { color: theme.text }]}>{post.likes ?? 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedPostId(post.id);
                        setPostComments([]);
                        loadComments(post.id);
                        setCommentVisible(true);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
                      <Text style={[styles.actionText, { color: theme.text }]}>{post.comments ?? 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openRecipe(post.dish_name)}
                    >
                      <Ionicons name="restaurant-outline" size={20} color={theme.primary} />
                      <Text style={[styles.actionText, { color: theme.text }]}>{t("result_view_recipe")}</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* Comment Modal */}
        <Modal visible={commentVisible} transparent animationType="slide" onRequestClose={closeCommentModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                  {t("home_write_comment")}
                </Text>
                <TouchableOpacity onPress={closeCommentModal}>
                  <Ionicons name="close" size={24} color={theme.subtext} />
                </TouchableOpacity>
              </View>


              <ScrollView style={styles.commentsList}>
                {loadingComments ? (
                  <ActivityIndicator color={theme.primary} />
                ) : postComments.length === 0 ? (
                  <Text style={[styles.noComments, { color: theme.subtext }]}>
                    {t("community_no_comments")} {t("community_be_first")}
                  </Text>
                ) : (
                  postComments.map((comment, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.commentItem,
                        { borderBottomColor: theme.border },
                        comment.parent_id ? { marginLeft: 24, paddingLeft: 12 } : {}
                      ]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <Text style={[styles.commentUser, { color: theme.text, marginBottom: 0 }]}>
                          {comment.user_name}
                          <Text style={[styles.commentTime, { color: theme.subtext }]}>・{formatTimeAgo(comment.created_at)}</Text>
                        </Text>

                        {/* Reply Button (Icon) */}
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => {
                            setSelectedParentId(comment.id);
                            setReplyToUserName(comment.user_name);
                          }}
                        >
                          <Ionicons name="arrow-undo-outline" size={16} color={theme.subtext} />
                        </TouchableOpacity>
                      </View>

                      <Text style={[styles.commentText, { color: theme.text }]}>{comment.comment}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Reply Target Display */}
              {replyToUserName && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                  backgroundColor: theme.background, // or theme.canvas
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: theme.border
                }}>
                  <Text style={{ color: theme.subtext, fontSize: 12, marginRight: 8 }}>
                    <Text style={{ fontWeight: 'bold', color: theme.text }}>@{replyToUserName}</Text> {t("home_replying_to")}
                  </Text>
                  <TouchableOpacity onPress={() => { setSelectedParentId(null); setReplyToUserName(null); }}>
                    <Ionicons name="close-circle" size={18} color={theme.subtext} />
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={replyToUserName ? `${t("home_replying_to")} @${replyToUserName}...` : t("home_comment_placeholder")}
                placeholderTextColor={theme.subtext}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                onPress={submitComment}
              >
                <Text style={styles.btnText}>{t("home_submit")}</Text>
              </TouchableOpacity>

            </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notification Center */}
      <NotificationCenter
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
      />
    </GlobalWrapper >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    marginBottom: 4,
    fontWeight: "600",
  },
  title: {
    fontWeight: "800",
  },

  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "bold",
  },

  horizontalScroll: {
    paddingLeft: 20,
    marginBottom: 16,
  },

  card: {
    width: width * 0.65,
    height: 200,
    marginRight: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 16,
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 35,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyBox: {
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  noResults: {
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },

  // Feed Styles
  feedCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  feedUser: {
    fontWeight: "bold",
  },
  feedTime: {
    marginTop: 2,
  },
  feedImage: {
    width: "100%",
    height: 200,
  },
  feedContent: {
    padding: 10,
  },
  feedTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  feedText: {
    lineHeight: 20,
  },
  feedActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    padding: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 13,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  primaryBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },


  // Comments
  commentsList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  noComments: {
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  commentUser: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 14,
  },
  commentTime: {
    fontWeight: "normal",
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Search Section
  searchSection: {
    marginBottom: 8,
  },
  compactSearchCard: {
    marginHorizontal: 20,
  },
  searchCard: {
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  searchTitle: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  searchSubtitle: {
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  searchButtonContainer: {
    width: "100%",
  },
});
