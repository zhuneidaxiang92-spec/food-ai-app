import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import HomeScreen from "../app/home";
import PreviewScreen from "../app/preview";
import FavoritesScreen from "../app/favorites";
import HistoryScreen from "../app/history";
import SettingsScreen from "../app/settings";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    const { isDark } = useTheme();
    const { t } = useLanguage();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: isDark ? "#ffcc66" : "#ff9500",
                tabBarInactiveTintColor: isDark ? "#aaa" : "gray",
                tabBarStyle: {
                    backgroundColor: isDark ? "#000" : "#fff",
                    borderTopColor: isDark ? "#222" : "#ddd",
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    marginBottom: 5,
                    fontWeight: "600",
                },
                tabBarIcon: ({ color, focused }) => {
                    let icon: any = "ellipse";

                    if (route.name === "Home") icon = focused ? "home" : "home-outline";
                    else if (route.name === "Scan") icon = focused ? "camera" : "camera-outline";
                    else if (route.name === "Favorites") icon = focused ? "heart" : "heart-outline";
                    else if (route.name === "History") icon = focused ? "time" : "time-outline";
                    else if (route.name === "Settings") icon = focused ? "settings" : "settings-outline";

                    return <Ionicons name={icon} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: "ホーム" }} />
            <Tab.Screen name="Scan" component={PreviewScreen} options={{ title: "スキャン" }} />
            <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "お気に入り" }} />
            <Tab.Screen name="History" component={HistoryScreen} options={{ title: "履歴" }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "設定" }} />
        </Tab.Navigator>
    );
}
