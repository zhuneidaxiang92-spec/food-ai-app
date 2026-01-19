import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Slider from "@react-native-community/slider";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

// Legal content is now managed in translations.ts

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  // Theme (Dark / Light)
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  // Text Size (Dynamic scaling)
  const { fontSize, setFontSize } = useTextSize();

  // Language
  const { language, toggleLanguage, t } = useLanguage();

  // Legal Modal State
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalTitle, setModalTitle] = React.useState("");
  const [modalContent, setModalContent] = React.useState("");

  const openLegalModal = (titleKey: any, contentKey: any) => {
    // DEBUG MODE
    setModalTitle(`${t(titleKey)} [${language}]`);
    setModalContent(`Key: ${contentKey}\n\n${t(contentKey)}`);
    setModalVisible(true);
  };

  // =========================
  // 🔐 LOGOUT FUNCTION
  // =========================
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "access_token",
        "user",
      ]);

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert("エラー", "ログアウトに失敗しました");
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header */}
        <Text
          style={[
            styles.header,
            { color: theme.text, fontSize: fontSize + 4 },
          ]}
        >
          {t("settings_title")} [Logic Patch v2]
        </Text>

        {/* Profile Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_profile")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_edit_profile")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* APP SETTINGS */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_app")}
          </Text>

          {/* Language */}
          <TouchableOpacity
            style={styles.row}
            onPress={toggleLanguage}
          >
            <Ionicons name="language-outline" size={26} color="#007AFF" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_language")}
            </Text>
            <Text style={{ marginLeft: "auto", color: theme.subtext }}>
              {language === "ja" ? "日本語" : "English"}
            </Text>
          </TouchableOpacity>

          {/* TEXT SIZE */}
          <View style={styles.row}>
            <Ionicons name="text-outline" size={26} color="#007AFF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
                {t("settings_text_size")}
              </Text>

              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={12}
                maximumValue={28}
                step={1}
                value={fontSize}
                onValueChange={(val) => setFontSize(val)}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#ccc"
              />

              <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
                {t("settings_current_size")}: {fontSize}
              </Text>
            </View>
          </View>

          {/* DARK MODE */}
          <View style={styles.row}>
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={26}
              color={isDark ? "#FFD700" : "#FF9500"}
            />

            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_dark_mode")}
            </Text>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? "#FFD700" : "#f4f3f4"}
              trackColor={{ false: "#ccc", true: "#666" }}
              style={{ marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* DATA */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_data")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Favorites")}
          >
            <Ionicons name="heart-outline" size={26} color="#FF3B30" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_open_fav")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("History")}
          >
            <Ionicons name="time-outline" size={26} color="#FF9500" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_view_hist")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LEGAL & SUPPORT */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_legal")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_terms", "legal_terms_body")}
          >
            <Ionicons name="document-text-outline" size={26} color="#34C759" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_terms")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_privacy", "legal_privacy_body")}
          >
            <Ionicons name="shield-checkmark-outline" size={26} color="#5856D6" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_privacy")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_support", "legal_support_body")}
          >
            <Ionicons name="mail-outline" size={26} color="#007AFF" />
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_support")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t("settings_logout")}</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: theme.text, fontSize }]}>
          {t("settings_version")}
        </Text>
      </ScrollView>

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.text, fontSize: fontSize + 4 },
              ]}
            >
              {modalTitle}
            </Text>
            <ScrollView style={styles.modalScroll}>
              <Text
                style={[
                  styles.modalText,
                  { color: theme.text, fontSize: fontSize },
                ]}
              >
                {modalContent}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>{t("home_cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontWeight: "bold", padding: 20, paddingTop: 40 },

  card: {
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
  },

  cardTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  rowText: {
    marginLeft: 12,
  },

  logoutBtn: {
    marginTop: 30,
    marginBottom: 60,
    backgroundColor: "#FF3B30",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },

  logoutText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  version: {
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalScroll: {
    marginBottom: 20,
  },
  modalText: {
    lineHeight: 24,
  },
  closeBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
