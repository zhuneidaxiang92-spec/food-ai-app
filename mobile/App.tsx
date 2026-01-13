// App.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";

import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TextSizeProvider } from "./context/TextSizeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Colors } from "./constants/colors";

// Sync navigation theme with custom theme
function ThemedNavigation() {
  const { isDark } = useTheme();

  // Keep internal fonts (regular, medium, bold)
  const baseTheme = isDark ? DarkTheme : DefaultTheme;

  // Mock Login for Development
  React.useEffect(() => {
    const injectMockUser = async () => {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const user = await AsyncStorage.getItem("user");
      if (!user) {
        console.log("Injecting mock user for development...");
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            name: "Test User",
            access_token: "mock_token",
            email: "test@example.com",
            id: 1,
            login_provider: "email",
          })
        );
      }
    };
    injectMockUser();
  }, []);

  return (
    <NavigationContainer
      theme={{
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          background: isDark
            ? Colors.dark.background
            : Colors.light.background,
          card: isDark ? Colors.dark.card : Colors.light.card,
          text: isDark ? Colors.dark.text : Colors.light.text,
          border: isDark ? Colors.dark.border : Colors.light.border,
          primary: "#FF7043",
        },
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TextSizeProvider>
        <LanguageProvider>
          <ThemedNavigation />
        </LanguageProvider>
      </TextSizeProvider>
    </ThemeProvider>
  );
}
