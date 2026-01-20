import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import GlobalWrapper from "../components/GlobalWrapper";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";

const { width } = Dimensions.get("window");

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<any[]>([]);

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const { fontSize } = useTextSize();
  const { t } = useLanguage();

  // Note modal states
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [noteText, setNoteText] = useState("");

  const loadFavorites = useCallback(async () => {
    const stored = await AsyncStorage.getItem("favorites");
    const parsed = stored ? JSON.parse(stored) : [];
    setFavorites(parsed);
  }, []);

  const removeFavorite = useCallback(async (name: string) => {
    Alert.alert(
      t("fav_delete_alert_title"),
      name,
      [
        { text: t("fav_delete_alert_cancel"), style: "cancel" },
        {
          text: t("fav_delete_alert_delete"),
          style: "destructive",
          onPress: async () => {
            const updated = favorites.filter((item) => item.name_jp !== name);
            await AsyncStorage.setItem("favorites", JSON.stringify(updated));
            setFavorites(updated);
          },
        },
      ]
    );
  }, [t, favorites]);

  const openNoteModal = useCallback((item: any) => {
    setSelectedItem(item);
    setNoteText(item.note || "");
    setNoteModalVisible(true);
  }, []);

  const saveNote = useCallback(async () => {
    if (!selectedItem) return;

    const updated = favorites.map((item) =>
      item.name_jp === selectedItem.name_jp ? { ...item, note: noteText } : item
    );

    await AsyncStorage.setItem("favorites", JSON.stringify(updated));
    setFavorites(updated);
    setNoteModalVisible(false);
    setSelectedItem(null);
    setNoteText("");
  }, [selectedItem, favorites, noteText]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadFavorites);
    return unsubscribe;
  }, [navigation]);

  return (
    <GlobalWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 6 }]}>
            {t("fav_title")}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtext, fontSize: fontSize }]}>
            {favorites.length} {favorites.length === 1 ? "item" : "items"}
          </Text>
        </View>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="heart-outline" size={64} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext, fontSize: fontSize + 2 }]}>
              {t("fav_empty")}
            </Text>
            <Text style={[styles.emptyHint, { color: theme.subtext, fontSize }]}>
              レシピにいいね♡して保存しよう
            </Text>
          </GlassCard>
        ) : (
          favorites.map((item, idx) => (
            <GlassCard key={idx} style={styles.card} delay={idx * 80}>
              {/* Image - Non-clickable */}
              <View style={styles.imageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View
                    style={[
                      styles.image,
                      styles.placeholder,
                      { backgroundColor: theme.border },
                    ]}
                  >
                    <Ionicons name="restaurant" size={40} color={theme.subtext} />
                  </View>
                )}
              </View>

              {/* Recipe Info */}
              <View style={styles.content}>
                <Text
                  style={[
                    styles.recipeName,
                    { color: theme.text, fontSize: fontSize + 2 },
                  ]}
                >
                  {item.name_jp}
                </Text>
                {item.description && (
                  <Text
                    style={[styles.description, { color: theme.subtext, fontSize }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}

                {/* Note Preview */}
                {item.note && (
                  <View style={styles.notePreview}>
                    <Ionicons name="document-text" size={14} color={theme.primary} />
                    <Text
                      style={[styles.notePreviewText, { color: theme.subtext, fontSize: fontSize - 2 }]}
                      numberOfLines={1}
                    >
                      {item.note}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionRow}>
                {/* Note Button - Small Icon Button */}
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    { backgroundColor: item.note ? theme.primary : theme.border }
                  ]}
                  onPress={() => openNoteModal(item)}
                >
                  <Ionicons
                    name={item.note ? "document-text" : "document-text-outline"}
                    size={20}
                    color={item.note ? "#fff" : theme.subtext}
                  />
                </TouchableOpacity>

                {/* Delete Button - Small Icon Button */}
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: theme.danger }]}
                  onPress={() => removeFavorite(item.name_jp)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Recipe Button - Main Action */}
                <View style={styles.mainButton}>
                  <AnimatedButton
                    title={t("fav_recipe_btn")}
                    onPress={() =>
                      navigation.navigate("Recipe", {
                        recipe: item,
                        recipeName: item.name_jp,
                      })
                    }
                    icon="restaurant-outline"
                    primary={true}
                  />
                </View>
              </View>
            </GlassCard>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                {t("hist_note_title")}
              </Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.modalRecipeName, { color: theme.text, fontSize }]}>
                {selectedItem?.name_jp}
              </Text>

              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t("hist_note_placeholder")}
                placeholderTextColor={theme.subtext}
                style={[
                  styles.noteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.background
                  },
                ]}
                multiline
                numberOfLines={6}
                autoFocus
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                  {t("hist_note_cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={saveNote}
              >
                <Text style={styles.saveBtnText}>{t("hist_note_save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GlobalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: "600",
  },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 40,
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: "center",
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    marginBottom: 16,
  },
  recipeName: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  description: {
    lineHeight: 20,
  },
  notePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  notePreviewText: {
    flex: 1,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mainButton: {
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
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
  modalRecipeName: {
    fontWeight: "600",
    marginBottom: 16,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
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
  saveBtn: {},
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
