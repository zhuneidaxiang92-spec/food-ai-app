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
import GlobalWrapper from "../components/GlobalWrapper";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";

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
    Alert.alert(
      t("settings_logout"),
      "本当にログアウトしますか?",
      [
        { text: t("profile_cancel"), style: "cancel" },
        {
          text: t("settings_logout"),
          style: "destructive",
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  return (
    <GlobalWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, fontSize: fontSize + 6 },
            ]}
          >
            {t("settings_title")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtext, fontSize }]}>
            アプリの設定をカスタマイズ
          </Text>
        </View>

        {/* Profile Section */}
        <GlassCard style={styles.section} delay={0}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_profile")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="person-circle-outline" size={28} color={theme.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_edit_profile")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </GlassCard>

        {/* APP SETTINGS */}
        <GlassCard style={styles.section} delay={100}>
          <Text
            style={[
              styles.sectionTitle,
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
            <View style={styles.rowIcon}>
              <Ionicons name="language-outline" size={26} color={theme.primary} />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_language")}
            </Text>
            <Text style={[styles.rowValue, { color: theme.subtext }]}>
              {language === "ja" ? "日本語" : "English"}
            </Text>
          </TouchableOpacity>

          {/* TEXT SIZE */}
          <View style={[styles.row, styles.sliderRow]}>
            <View style={styles.rowIcon}>
              <Ionicons name="text-outline" size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
                  {t("settings_text_size")}
                </Text>
                <Text style={[styles.rowValue, { color: theme.subtext }]}>
                  {fontSize}
                </Text>
              </View>

              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={12}
                maximumValue={28}
                step={1}
                value={fontSize}
                onValueChange={(val) => setFontSize(val)}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
              />
            </View>
          </View>

          {/* DARK MODE */}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={26}
                color={isDark ? "#FFD700" : "#FF9500"}
              />
            </View>

            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_dark_mode")}
            </Text>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? "#FFD700" : "#f4f3f4"}
              trackColor={{ false: "#ccc", true: "#666" }}
            />
          </View>
        </GlassCard>

        {/* DATA */}
        <GlassCard style={styles.section} delay={200}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_data")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("Favorites")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="heart-outline" size={26} color={theme.danger} />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_open_fav")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("History")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="time-outline" size={26} color={theme.warning} />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_view_hist")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </GlassCard>

        {/* LEGAL & SUPPORT (Restored from the other branch but with GlassCard style) */}
        <GlassCard style={styles.section} delay={300}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, fontSize: fontSize + 2 },
            ]}
          >
            {t("settings_legal")}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_terms", "legal_terms_body")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="document-text-outline" size={26} color="#34C759" />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_terms")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_privacy", "legal_privacy_body")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#5856D6" />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_privacy")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openLegalModal("settings_support", "legal_support_body")}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="mail-outline" size={26} color="#007AFF" />
            </View>
            <Text style={[styles.rowText, { color: theme.text, fontSize }]}>
              {t("settings_support")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </GlassCard>

        {/* LOGOUT */}
        <View style={styles.logoutContainer}>
          <AnimatedButton
            title={t("settings_logout")}
            onPress={handleLogout}
            icon="log-out-outline"
            primary={false}
          />
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: theme.subtext, fontSize }]}>
          {t("settings_version")}
        </Text>

        <View style={{ height: 100 }} />
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
    </GlobalWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: "600",
  },

  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },

  sliderRow: {
    alignItems: "flex-start",
  },

  rowIcon: {
    width: 36,
    alignItems: "center",
  },

  rowText: {
    flex: 1,
    marginLeft: 12,
    fontWeight: "500",
  },

  rowValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },

  version: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
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
