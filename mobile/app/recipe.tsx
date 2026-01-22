import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import { useNavigation } from "@react-navigation/native";

import GlobalWrapper from "../components/GlobalWrapper";
import TypingText from "../components/TypingText";
import GlassCard from "../components/GlassCard";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import { getCachedRecipe, setCachedRecipe } from "../utils/recipeCache";

const API_URL = "https://cautiously-mesocratic-albert.ngrok-free.dev";

export default function RecipeScreen({ route }: any) {
  const navigation = useNavigation<any>();

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { fontSize } = useTextSize();
  const { t } = useLanguage();

  const recipeFromResult = route?.params?.recipe;
  const recipeName = route?.params?.recipeName;

  // ----------------------------------
  // Normalize recipe based on language
  // ----------------------------------
  const normalizeRecipe = (r: any, currentLanguage: string) => {
    if (!r) return null;

    // 言語に応じてフィールドを選択
    const isJapanese = currentLanguage === "ja";

    return {
      name_jp: isJapanese
        ? (r.name_jp || r.title_jp || r.name_en || t("recipe_unknown"))
        : (r.name_en || r.name_jp || t("recipe_unknown")),
      name_en: r.name_en || r.name_jp || "",
      image: r.image || null,
      instructions_jp: isJapanese
        ? (r.instructions_jp || r.instructions_en || t("recipe_no_instructions"))
        : (r.instructions_en || r.instructions_jp || t("recipe_no_instructions")),
      ingredients_jp: isJapanese
        ? (r.ingredients_jp || r.ingredients_en || [])
        : (r.ingredients_en || r.ingredients_jp || []),
      sourceUrl: r.sourceUrl || null,
    };
  };

  // ----------------------------------
  // State
  // ----------------------------------
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Share modal
  const [shareVisible, setShareVisible] = useState(false);
  const [opinion, setOpinion] = useState("");
  const [sharing, setSharing] = useState(false);

  // Get current language
  const { language } = useLanguage();

  // ----------------------------------
  // Reset when params change
  // ----------------------------------
  useEffect(() => {
    if (recipeFromResult) {
      setRecipe(normalizeRecipe(recipeFromResult, language));
      setLoading(false);
      return;
    }

    if (recipeName) {
      setRecipe(null);
      setLoading(true);
    }
  }, [recipeFromResult, recipeName, language]);

  // ----------------------------------
  // Fetch recipe by name with cache
  // ----------------------------------
  useEffect(() => {
    if (!recipeName || recipeFromResult) return;

    const fetchRecipe = async () => {
      try {
        // 1. キャッシュキーに言語を含める
        const cacheKey = `${recipeName}_${language}`;
        const cached = await getCachedRecipe(cacheKey);
        if (cached) {
          console.log("✅ Recipe loaded from cache:", cacheKey);
          setRecipe(normalizeRecipe(cached, language));
          setLoading(false);
          return;
        }

        // 2. Fetch from API with language parameter
        console.log("🌐 Fetching recipe from API:", recipeName, "Language:", language);
        const res = await fetch(`${API_URL}/recipe/${recipeName}?lang=${language}`);
        const data = await res.json();

        if (data.recipe) {
          const normalized = normalizeRecipe(data.recipe, language);
          setRecipe(normalized);

          // 3. Cache the result with language-specific key
          await setCachedRecipe(cacheKey, data.recipe);
          console.log("💾 Recipe cached:", cacheKey);
        } else {
          setRecipe(null);
        }
      } catch (error) {
        console.error("❌ Error fetching recipe:", error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeName, language]);

  // ----------------------------------
  // Favorite logic
  // ----------------------------------
  useEffect(() => {
    if (!recipe) return;

    const load = async () => {
      const favoritesJson = await AsyncStorage.getItem("favorites");
      const stored = favoritesJson ? JSON.parse(favoritesJson) : [];
      setIsFavorite(stored.some((r: any) => r.name_jp === recipe.name_jp));
    };

    load();
  }, [recipe]);

  // ----------------------------------
  // TTS Logic
  // ----------------------------------
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakRecipe = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const text = `
      ${recipe.name_jp}。
      材料。
      ${recipe.ingredients_jp.join("。")}。
      作り方。
      ${clean(recipe.instructions_jp)}
    `;

    setIsSpeaking(true);
    Speech.speak(text, {
      language: "ja",
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggleFavorite = async () => {
    const favoritesJson = await AsyncStorage.getItem("favorites");
    const stored = favoritesJson ? JSON.parse(favoritesJson) : [];
    const updated = isFavorite
      ? stored.filter((r: any) => r.name_jp !== recipe.name_jp)
      : [...stored, recipe];

    await AsyncStorage.setItem("favorites", JSON.stringify(updated));
    setIsFavorite(!isFavorite);
  };

  // ----------------------------------
  // Share to Community
  // ----------------------------------
  const submitShare = async () => {
    try {
      setSharing(true);

      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        Alert.alert(t("common_error"), t("recipe_login_required"));
        return;
      }

      const user = JSON.parse(storedUser);

      const res = await fetch(`${API_URL}/api/community/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          dish_name: recipe.name_jp,
          dish_image: recipe.image || "https://via.placeholder.com/300",
          opinion,
        }),
      });

      if (!res.ok) {
        throw new Error("Post failed");
      }

      Alert.alert(t("recipe_success"), t("recipe_posted"));
      setOpinion("");
      setShareVisible(false);
    } catch (e) {
      Alert.alert(t("common_error"), t("recipe_failed"));
    } finally {
      setSharing(false);
    }
  };


  // ----------------------------------
  // Clean HTML
  // ----------------------------------
  const clean = (text: string) =>
    text
      ?.replace(/<li>/g, "• ")
      .replace(/<\/li>/g, "\n")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim() || "";

  // ----------------------------------
  // UI STATES
  // ----------------------------------
  if (loading) {
    return (
      <GlobalWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF7043" />
        </View>
      </GlobalWrapper>
    );
  }

  if (!recipe) {
    return (
      <GlobalWrapper>
        <View style={styles.center}>
          <Text style={{ fontSize: fontSize + 2, color: theme.text }}>
            {t("result_recipe_not_found")}
          </Text>
        </View>
      </GlobalWrapper>
    );
  }

  // ----------------------------------
  // MAIN UI
  // ----------------------------------
  return (
    <GlobalWrapper>
      <ScrollView style={{ backgroundColor: theme.background }}>
        <GlassCard style={styles.card}>
          <Image
            source={{ uri: recipe.image || "https://via.placeholder.com/400" }}
            style={styles.image}
          />

          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: theme.text, fontSize: fontSize + 6 },
              ]}
            >
              {recipe.name_jp}
            </Text>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={speakRecipe}
              >
                <Ionicons
                  name={isSpeaking ? "stop-circle" : "volume-high"}
                  size={26}
                  color={isSpeaking ? "#FF6347" : theme.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={() => setShareVisible(true)}
              >
                <Ionicons
                  name="share-social-outline"
                  size={26}
                  color={theme.text}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleFavorite}>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={26}
                  color={isFavorite ? "red" : theme.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* BACK BUTTON OVERLAY (New) */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Tabs");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 3 }]}>
          🍴 {t("recipe_ingredients")}
        </Text>

        <GlassCard style={styles.ingredientsBox} delay={200}>
          {recipe.ingredients_jp.map((i: string, idx: number) => (
            <Text key={idx} style={{ fontSize, color: theme.text }}>
              • {i}
            </Text>
          ))}
        </GlassCard>

        <Text style={[styles.sectionTitle, { fontSize: fontSize + 3 }]}>
          🧑‍🍳 {t("recipe_instructions")}
        </Text>

        <TypingText
          text={clean(recipe.instructions_jp)}
          textStyle={{ color: theme.text, fontSize }}
          skipAnimation={true}
          showSkipButton={false}
        />

        {!!recipe.sourceUrl && (
          <Text
            style={[styles.link, { fontSize: fontSize + 1 }]}
            onPress={() => Linking.openURL(recipe.sourceUrl)}
          >
            🔗 {t("recipe_view_full")}
          </Text>
        )}

        {/* Home Button */}
        <View style={styles.homeButtonContainer}>
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.navigate("Tabs", { screen: "Home" });
              } else {
                navigation.navigate("Tabs");
              }
            }}
          >
            <Ionicons name="home" size={20} color="#fff" />
            <Text style={styles.homeButtonText}>{t("result_back_home")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ======================
          Share Modal
      ====================== */}
      <Modal visible={shareVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                {t("recipe_share_title")}
              </Text>
              <TouchableOpacity onPress={() => setShareVisible(false)}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalRecipeName, { color: theme.text, fontSize }]}>
                {recipe.name_jp}
              </Text>

              <TextInput
                placeholder={t("recipe_share_placeholder")}
                placeholderTextColor={theme.subtext}
                value={opinion}
                onChangeText={setOpinion}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                multiline
                numberOfLines={4}
                autoFocus
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setShareVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                  {t("recipe_cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.postBtn, { backgroundColor: theme.primary }]}
                onPress={submitShare}
                disabled={sharing}
              >
                <Text style={styles.postBtnText}>
                  {sharing ? t("recipe_posting") : t("recipe_post")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GlobalWrapper>
  );
}

// ----------------------------------
// Styles
// ----------------------------------
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    marginBottom: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: 250 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  title: { fontWeight: "bold", flex: 1 },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: "#FF7043",
  },
  ingredientsBox: {
    padding: 14,
    marginBottom: 16,
  },
  link: {
    marginTop: 20,
    textDecorationLine: "underline",
    marginBottom: 30,
    color: "#4285F4",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: "bold",
  },
  modalScrollView: {
    maxHeight: 200,
  },
  modalRecipeName: {
    fontWeight: "600",
    marginBottom: 16,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontWeight: "600",
  },
  postBtn: {},
  postBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 20,
  },
  homeButtonContainer: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
