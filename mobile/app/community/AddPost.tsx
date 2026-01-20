import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import { createCommunityPost } from "../api/posts";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTextSize } from "../../context/TextSizeContext";
import { Colors } from "../../constants/colors";
import GlobalWrapper from "../../components/GlobalWrapper";
import GlassCard from "../../components/GlassCard";
import AnimatedButton from "../../components/AnimatedButton";

export default function AddPostScreen() {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { t } = useLanguage();
  const { fontSize } = useTextSize();

  const [dishImage, setDishImage] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [opinion, setOpinion] = useState("");
  const [posting, setPosting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("scan_permission_title"),
          t("scan_permission_msg")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setDishImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert(t("common_error"), t("profile_image_error"));
    }
  };

  const submitPost = async () => {
    // Validation
    if (!dishImage) {
      Alert.alert(t("common_error"), "画像を選択してください");
      return;
    }

    if (!dishName.trim()) {
      Alert.alert(t("common_error"), "料理名を入力してください");
      return;
    }

    try {
      setPosting(true);
      await createCommunityPost(dishName.trim(), dishImage, opinion.trim());

      Alert.alert(
        t("recipe_success"),
        t("community_post_success"),
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Post creation failed:", error);
      Alert.alert(t("common_error"), t("community_post_error"));
    } finally {
      setPosting(false);
    }
  };

  return (
    <GlobalWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("home_post")}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Image Picker */}
        <GlassCard style={styles.imageSection}>
          {dishImage ? (
            <View>
              <Image source={{ uri: dishImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.changeImageBtn, { backgroundColor: theme.primary }]}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={16} color="#fff" />
                <Text style={styles.changeImageText}>画像を変更</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Ionicons name="image-outline" size={64} color={theme.subtext} />
              <Text style={[styles.imagePickerText, { color: theme.subtext, fontSize: fontSize + 1 }]}>
                料理の画像を選択
              </Text>
              <Text style={[styles.imagePickerHint, { color: theme.subtext, fontSize: fontSize - 1 }]}>
                タップして写真を追加
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Dish Name Input */}
        <GlassCard style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text, fontSize }]}>
            料理名 <Text style={{ color: theme.danger }}>*</Text>
          </Text>
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
            placeholder="例: チャーハン"
            placeholderTextColor={theme.subtext}
            value={dishName}
            onChangeText={setDishName}
            maxLength={50}
          />
        </GlassCard>

        {/* Opinion Input */}
        <GlassCard style={styles.inputSection}>
          <Text style={[styles.label, { color: theme.text, fontSize }]}>
            感想・コメント（任意）
          </Text>
          <TextInput
            style={[
              styles.textarea,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
                fontSize,
              },
            ]}
            placeholder="料理の感想や作った時のコツなどを共有しましょう..."
            placeholderTextColor={theme.subtext}
            value={opinion}
            onChangeText={setOpinion}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: theme.subtext, fontSize: fontSize - 2 }]}>
            {opinion.length}/500
          </Text>
        </GlassCard>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <AnimatedButton
            title={posting ? t("community_posting") : t("community_post")}
            onPress={submitPost}
            primary
            disabled={posting}
            icon={posting ? undefined : "send"}
          />
        </View>
      </ScrollView>
    </GlobalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
  },
  imageSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  imagePicker: {
    aspectRatio: 4 / 3,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  imagePickerText: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
  },
  imagePickerHint: {
    opacity: 0.8,
  },
  previewImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  changeImageBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  changeImageText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 120,
  },
  charCount: {
    textAlign: "right",
    marginTop: 6,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },
});
