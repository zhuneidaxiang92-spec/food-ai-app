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

const API_URL = getApiUrl();
const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
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

  useEffect(() => {
    loadRecommendations();
    loadCommunityFeed();
  }, []);

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
      const res = await fetch(`${API_URL}/api/community/posts`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCommunityPosts(data);
      } else if (data.posts && Array.isArray(data.posts)) {
        setCommunityPosts(data.posts);
      } else {
        setCommunityPosts([]);
      }
    } catch (e) {
      console.log("ERROR loading community feed:", e);
      setCommunityPosts([]);
    }
    setLoadingCommunity(false);
  };

  const openRecipe = (foodName: string) => {
    if (!foodName) return;
    navigation.navigate("Recipe", { recipeName: foodName });
  };

  const likePost = async (postId: number) => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      await fetch(`${API_URL}/api/community/post/${postId}/like?user_id=${user.id}`, {
        method: "POST",
      });

      loadCommunityFeed();
    } catch {
      Alert.alert("エラー", "いいねに失敗しました");
    }
  };

  const submitComment = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser || !selectedPostId) return;
      const user = JSON.parse(storedUser);

      await fetch(`${API_URL}/api/community/post/${selectedPostId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, comment: commentText }),
      });

      setCommentText("");
      setSelectedPostId(null);
      setCommentVisible(false);
      loadCommunityFeed();
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
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.subtext, fontSize: fontSize }]}>
            {t("home_welcome")}
          </Text>
          <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 10 }]}>
            {t("home_subtitle")}
          </Text>
        </View>

        {/* Recommendations Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("home_featured")}
          </Text>
        </View>

        {foods.length === 0 ? (
          <GlassCard style={styles.emptyBox}>
            <Text style={[styles.noResults, { fontSize, color: theme.subtext }]}>
              {t("home_no_recs")}
            </Text>
            <AnimatedButton
              title={t("home_search_btn")}
              onPress={() => navigation.navigate("検索画面")}
              primary={true}
            />
          </GlassCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {foods.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openRecipe(item.name)}
                activeOpacity={0.9}
              >
                <GlassCard style={styles.card} delay={index * 100}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.placeholder, { backgroundColor: theme.border }]}>
                      <Ionicons name="restaurant" size={40} color={theme.subtext} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.cardOverlay}
                  >
                    <Text style={[styles.cardTitle, { fontSize: fontSize + 2 }]}>
                      {item.name}
                    </Text>
                  </LinearGradient>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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
              <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                <Text style={[styles.noResults, { fontSize, color: theme.subtext }]}>
                  {t("home_no_posts")}
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: theme.secondary }]}
                  onPress={() => navigation.navigate("投稿画面")}
                >
                  <Text style={styles.btnText}>{t("home_first_post")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              communityPosts.map((post, index) => (
                <GlassCard
                  key={post.id}
                  style={styles.feedCard}
                  delay={index * 100 + 400} // Start after recommendations
                >
                  <View style={styles.feedHeader}>
                    <View style={[styles.avatar, { backgroundColor: theme.border }]}>
                      <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                    <View>
                      <Text style={[styles.feedUser, { color: theme.text, fontSize }]}>
                        User #{post.user_id || "?"}
                      </Text>
                      <Text style={[styles.feedTime, { color: theme.subtext, fontSize: fontSize - 2 }]}>
                        Just now
                      </Text>
                    </View>
                  </View>

                  {post.dish_image && (
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
                      onPress={() => likePost(post.id)}
                    >
                      <Ionicons name="heart-outline" size={20} color={theme.text} />
                      <Text style={[styles.actionText, { color: theme.text }]}>{post.likes ?? 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedPostId(post.id);
                        setCommentVisible(true);
                      }}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color={theme.text} />
                      <Text style={[styles.actionText, { color: theme.text }]}>{post.comments ?? 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openRecipe(post.dish_name)}
                    >
                      <Ionicons name="restaurant-outline" size={20} color={theme.text} />
                      <Text style={[styles.actionText, { color: theme.text }]}>{t("result_view_recipe")}</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* Comment Modal */}
        <Modal visible={commentVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                  {t("home_write_comment")}
                </Text>
                <TouchableOpacity onPress={() => setCommentVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.subtext} />
                </TouchableOpacity>
              </View>

              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder={t("home_comment_placeholder")}
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
          </View>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GlobalWrapper>
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
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontWeight: "bold",
  },

  horizontalScroll: {
    paddingLeft: 20,
    marginBottom: 20,
  },

  card: {
    width: width * 0.7,
    height: 220,
    marginRight: 15,
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
    padding: 15,
    paddingTop: 40,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyBox: {
    margin: 20,
    padding: 30,
    alignItems: "center",
  },
  noResults: {
    marginBottom: 15,
    textAlign: "center",
  },

  // Feed Styles
  feedCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    height: 250,
  },
  feedContent: {
    padding: 12,
  },
  feedTitle: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  feedText: {
    lineHeight: 20,
  },
  feedActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    padding: 10,
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
});
