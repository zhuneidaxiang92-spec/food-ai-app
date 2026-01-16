import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import { getApiUrl } from "../constants/config";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import GlobalWrapper from "../components/GlobalWrapper";
import { setCachedRecipe } from "../utils/recipeCache";

export default function PreviewScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const { fontSize } = useTextSize();
  const { t } = useLanguage();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = getApiUrl();

  // PICK IMAGE
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t("scan_permission_title"), t("scan_permission_msg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // TAKE PHOTO
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(t("scan_permission_title"), t("scan_permission_msg"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      cameraType: ImagePicker.CameraType.back,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // ANALYZE IMAGE
  const analyzeImage = async () => {
    if (!imageUri) return;

    setLoading(true);

    try {
      // --- A. RESIZE IMAGE (Optimization) ---
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Resize to max 800px width
        { compress: 0.7, format: SaveFormat.JPEG }
      );

      const finalUri = manipResult.uri;
      // ---------------------------------------

      const filename = finalUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const formData = new FormData();
      formData.append("file", {
        uri: finalUri,
        name: filename,
        type,
      } as any);

      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const data = res.data;

      if (!data || data.error) {
        Alert.alert(t("result_error"), t("scan_error"));
        setLoading(false);
        return;
      }

      const normalized = {
        predicted_food_jp: data.predicted_food_jp || "不明",
        predicted_food_en: data.predicted_food_en || "",
        confidence: data.confidence || 0,
        recipe: data.recipe || null,
        image: imageUri,
      };

      const newItem = {
        date: new Date().toISOString().split("T")[0],
        name: normalized.predicted_food_jp,
        name_en: normalized.predicted_food_en || "", // ✅ Fallback to empty string
        image: normalized.image,
        confidence: normalized.confidence,
        recipe: normalized.recipe, // ✅ CACHE FULL RECIPE
      };

      const oldHistory =
        JSON.parse(await AsyncStorage.getItem("history")) || [];

      await AsyncStorage.setItem(
        "history",
        JSON.stringify([newItem, ...oldHistory])
      );

      // Cache the recipe for faster future access
      if (normalized.recipe) {
        await setCachedRecipe(normalized.predicted_food_jp, normalized.recipe);
        console.log("💾 Recipe cached from AI analysis:", normalized.predicted_food_jp);
      }

      navigation.navigate("Result", {
        result: normalized,
        fallbackImage: normalized.image,
      });

    } catch (error) {
      console.error("❌ Error analyzing:", error);
      Alert.alert(
        t("result_error"),
        t("scan_error_detail")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalWrapper>
      <View style={styles.contentContainer}>
        {/* Header */}
        <Text
          style={[
            styles.header,
            { color: theme.text, fontSize: fontSize + 8 },
          ]}
        >
          📸 {t("scan_title")}
        </Text>

        <Text
          style={[
            styles.subText,
            { color: theme.subtext, fontSize },
          ]}
        >
          {t("scan_subtitle")}
        </Text>

        {/* Preview Box */}
        <GlassCard style={styles.previewCard}>
          <View style={styles.previewContent}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons
                  name="image-outline"
                  size={60}
                  color={theme.subtext}
                />
                <Text style={{ color: theme.subtext, marginTop: 10 }}>
                  {t("scan_placeholder")}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* CONTROLS */}
        <View style={styles.controls}>
          <AnimatedButton
            title={t("scan_pick_image")}
            icon="images"
            onPress={pickImage}
            primary={false}
          />
          <AnimatedButton
            title={t("scan_take_photo")}
            icon="camera"
            onPress={takePhoto}
            primary={false}
          />

          {imageUri && (
            <View style={{ marginTop: 12 }}>
              <AnimatedButton
                title={t("scan_analyze")}
                icon="search"
                onPress={analyzeImage}
                primary={true}
              />
            </View>
          )}
        </View>

        {/* LOADING */}
        {loading && (
          <GlassCard style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text
              style={[styles.loadingText, { fontSize, color: theme.primary }]}
            >
              {t("scan_analyzing")}
            </Text>
          </GlassCard>
        )}
      </View>
    </GlobalWrapper>
  );
}

//
// Styles
//
const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  header: { fontWeight: "900", marginBottom: 6 }, // Extra bold
  subText: { fontSize: 14, marginBottom: 20, textAlign: "center" },

  previewCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    marginBottom: 20,
  },

  previewContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  image: { width: "100%", height: "100%", borderRadius: 16 },

  controls: {
    width: "100%",
  },

  loadingBox: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  loadingText: { marginLeft: 10, fontWeight: "bold" },
});
