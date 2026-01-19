import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<any[]>([]);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [noteText, setNoteText] = useState("");

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const { fontSize } = useTextSize();
  const { t } = useLanguage();

  const loadHistory = async () => {
    const stored = JSON.parse((await AsyncStorage.getItem("history")) || "[]");
    setHistory(stored);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadHistory);
    return unsubscribe;
  }, [navigation]);

  const removeItem = async (name: string) => {
    const updated = history.filter((item) => item.name !== name);
    await AsyncStorage.setItem("history", JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    Alert.alert(t("hist_clear_title"), t("hist_clear_msg"), [
      { text: t("hist_clear_cancel"), style: "cancel" },
      {
        text: t("hist_clear_delete"),
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("history");
          setHistory([]);
        },
      },
    ]);
  };

  const openNoteModal = (item: any) => {
    setSelectedItem(item);
    setNoteText(item.note || "");
    setNoteModalVisible(true);
  };

  const saveNote = async () => {
    if (!selectedItem) return;

    const updated = history.map((item) =>
      item.name === selectedItem.name ? { ...item, note: noteText } : item
    );

    await AsyncStorage.setItem("history", JSON.stringify(updated));
    setHistory(updated);
    setNoteModalVisible(false);
    setSelectedItem(null);
    setNoteText("");
  };

  const renderRightActions = (name: string) => (
    <TouchableOpacity
      style={styles.deleteSwipe}
      onPress={() => removeItem(name)}
    >
      <Ionicons name="trash" size={30} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 4 }]}>
            {t("hist_title")}
          </Text>

          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Ionicons name="trash-outline" size={28} color="red" />
            </TouchableOpacity>
          )}
        </View>

        {/* EMPTY STATE */}
        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <LottieView
              autoPlay
              loop
              style={{ width: 180, height: 180 }}
              source={require("../assets/empty.json")}
            />
            <Text style={[styles.empty, { color: isDark ? "#bbb" : "#777", fontSize }]}>
              {t("hist_empty")}
            </Text>
          </View>
        ) : (
          <ScrollView>
            {history.map((item, idx) => (
              <Swipeable
                key={idx}
                renderRightActions={() => renderRightActions(item.name)}
              >
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  {/* Thumbnail */}
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} />
                  ) : (
                    <View
                      style={[
                        styles.thumb,
                        styles.placeholder,
                        { backgroundColor: isDark ? "#333" : "#eee" },
                      ]}
                    >
                      <Text style={{ color: theme.text, fontSize }}>🍽️</Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.info}>
                    <Text
                      style={[
                        styles.date,
                        { color: isDark ? "#aaa" : "#777", fontSize: fontSize - 2 },
                      ]}
                    >
                      {item.date}
                    </Text>
                    <Text
                      style={[
                        styles.name,
                        { color: theme.text, fontSize: fontSize + 1 },
                      ]}
                    >
                      {item.name}
                    </Text>

                    {/* Show note preview if exists */}
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

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {/* Note Button */}
                    <TouchableOpacity
                      style={[styles.noteBtn, { backgroundColor: item.note ? theme.primary : theme.border }]}
                      onPress={() => openNoteModal(item)}
                    >
                      <Ionicons
                        name={item.note ? "document-text" : "document-text-outline"}
                        size={20}
                        color={item.note ? "#fff" : theme.subtext}
                      />
                    </TouchableOpacity>

                    {/* Recipe Button */}
                    <LinearGradient
                      colors={["#FF7F50", "#FF6347"]}
                      style={styles.detailBtn}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("Recipe", {
                            recipe: item.recipe || null,
                            recipeName: item.name_en || item.name,
                          })
                        }
                      >
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
              </Swipeable>
            ))}
          </ScrollView>
        )}

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
                  {selectedItem?.name}
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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },

  title: { fontWeight: "bold" },

  emptyBox: { justifyContent: "center", alignItems: "center", marginTop: 40 },
  empty: {},

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  thumb: { width: 70, height: 70, borderRadius: 14 },
  placeholder: { justifyContent: "center", alignItems: "center" },

  info: { flex: 1, marginLeft: 12 },

  date: {},
  name: { fontWeight: "bold", marginBottom: 4 },

  notePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  notePreviewText: {
    flex: 1,
    fontStyle: "italic",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },

  noteBtn: {
    padding: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteSwipe: {
    width: 80,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 16,
  },

  detailBtn: {
    padding: 10,
    borderRadius: 12,
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
