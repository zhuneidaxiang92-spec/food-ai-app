import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import GlobalWrapper from "../components/GlobalWrapper";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";

import type { RootStackParamList } from "../App";

type ResultScreenRouteProp = RouteProp<RootStackParamList, "Result">;

export default function ResultScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<ResultScreenRouteProp>();
  const result = route.params?.result;

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const { fontSize } = useTextSize();
  const { t } = useLanguage();

  console.log("📌 RESULT =", result);

  // -------------------------------------------
  // ❌ No data
  // -------------------------------------------
  if (!result) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.error, { color: theme.text, fontSize }]}>
          {t("result_no_data")}
        </Text>
      </View>
    );
  }

  // -------------------------------------------
  // ✅ FIXED NAVIGATION
  // -------------------------------------------
  const openRecipe = () => {
    if (!result.recipe) {
      Alert.alert(t("result_error"), t("result_recipe_not_found"));
      return;
    }

    console.log("➡️ Open Recipe:", result.recipe?.name_jp);

    navigation.navigate("Recipe", {
      recipe: result.recipe,       // ✅ always pass scanned recipe
      recipeName: undefined,        // 🔥 clear Home-based recipe
      _ts: Date.now(),              // 🔥 force screen refresh
    });
  };

  return (
    <GlobalWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <Text
          style={[
            styles.header,
            { color: theme.text, fontSize: fontSize + 6 },
          ]}
        >
          🔍 {t("result_title")}
        </Text>

        <Text
          style={[
            styles.subText,
            { color: theme.subtext, fontSize: fontSize - 1 },
          ]}
        >
          {t("result_subtitle")}
        </Text>

        {/* FOOD CARD */}
        <GlassCard style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="restaurant" size={24} color={theme.primary} />
            <Text
              style={[
                styles.mainFood,
                { color: theme.text, fontSize: fontSize + 4 },
              ]}
            >
              {result.predicted_food_jp || result.predicted_food_en}
            </Text>
          </View>
        </GlassCard>

        {/* CONFIDENCE */}
        <GlassCard style={styles.confidenceBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="speedometer" size={22} color={theme.secondary} />
            <Text
              style={[
                styles.confidenceText,
                { color: theme.secondary, fontSize: fontSize + 1 },
              ]}
            >
              {t("result_confidence")}：{Math.round((result.confidence || 0) * 100)}%
            </Text>
          </View>
        </GlassCard>

        {/* ACTIONS */}
        <View style={styles.actionContainer}>
          <AnimatedButton
            title={t("result_view_recipe")}
            icon="book"
            onPress={openRecipe}
            primary={true}
          />

          <AnimatedButton
            title={t("result_back_home")}
            icon="home"
            onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
            primary={false}
          />
        </View>

        {/* FOOTER */}
        <Text
          style={[
            styles.footer,
            { color: theme.subtext, fontSize: fontSize - 2 },
          ]}
        >
          © 2025 SmartChef AI Project
        </Text>
      </ScrollView>
    </GlobalWrapper>
  );
}

// -------------------------------------------
// Styles
// -------------------------------------------
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  header: { fontWeight: "bold", marginBottom: 6 },
  subText: { marginBottom: 30 },

  card: {
    width: "100%",
    marginBottom: 15,
  },

  mainFood: { fontWeight: "bold", marginLeft: 10 },

  confidenceBox: {
    width: "100%",
    marginBottom: 30,
  },

  confidenceText: {
    fontWeight: "600",
    marginLeft: 8,
  },

  actionContainer: {
    width: "100%",
    marginBottom: 20,
  },

  footer: { position: "absolute", bottom: 10 },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { fontWeight: "bold" },
});


