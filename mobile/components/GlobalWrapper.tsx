// components/GlobalWrapper.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

import { LinearGradient } from "expo-linear-gradient";

export default function GlobalWrapper({ children }) {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <LinearGradient
      colors={[theme.background, isDark ? "#000" : "#E2E8F0"]}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
