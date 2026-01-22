import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";

interface HeroHeaderProps {
    userName?: string;
    greeting: string;
    subtitle: string;
    notificationCount?: number;
    onNotificationPress?: () => void;
    profileImageUrl?: string | null;
}

export default function HeroHeader({
    userName,
    greeting,
    subtitle,
    notificationCount = 0,
    onNotificationPress,
    profileImageUrl,
}: HeroHeaderProps) {
    const { isDark } = useTheme();
    const { fontSize } = useTextSize();
    const { t } = useLanguage();
    const theme = isDark ? Colors.dark : Colors.light;

    const displayUserName = userName || t("common_guest");

    // アニメーション値
    const scale = useSharedValue(1);
    const bellRotation = useSharedValue(0);

    useEffect(() => {
        // ウェルカムテキストの微細なパルスアニメーション
        scale.value = withRepeat(
            withSequence(
                withSpring(1.02, { damping: 2, stiffness: 80 }),
                withSpring(1, { damping: 2, stiffness: 80 })
            ),
            -1,
            true
        );
    }, []);

    const animatedTextStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedBellStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${bellRotation.value}deg` }],
    }));

    const handleNotificationPress = () => {
        // ベルを揺らすアニメーション
        bellRotation.value = withSequence(
            withSpring(-15, { damping: 2, stiffness: 200 }),
            withSpring(15, { damping: 2, stiffness: 200 }),
            withSpring(-10, { damping: 2, stiffness: 200 }),
            withSpring(10, { damping: 2, stiffness: 200 }),
            withSpring(0, { damping: 2, stiffness: 200 })
        );
        onNotificationPress?.();
    };

    return (
        <LinearGradient
            colors={
                isDark
                    ? [theme.background, "rgba(31, 41, 55, 0.95)"]
                    : [theme.background, "rgba(242, 244, 248, 0.95)"]
            }
            style={styles.container}
        >
            <View style={styles.topRow}>
                {/* アバター */}
                {profileImageUrl ? (
                    <Image
                        source={{ uri: profileImageUrl }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>
                            {displayUserName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* 通知ベル */}
                <TouchableOpacity
                    onPress={handleNotificationPress}
                    style={styles.notificationButton}
                >
                    <Animated.View style={animatedBellStyle}>
                        <Ionicons
                            name="notifications-outline"
                            size={24}
                            color={theme.text}
                        />
                    </Animated.View>
                    {/* 通知バッジ */}
                    {notificationCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.badgeText}>
                                {notificationCount > 99 ? "99+" : notificationCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* ウェルカムメッセージ */}
            <Animated.View style={animatedTextStyle}>
                <Text
                    style={[
                        styles.greeting,
                        { color: theme.subtext, fontSize: fontSize + 2 },
                    ]}
                >
                    {greeting}
                </Text>
                <Text
                    style={[
                        styles.subtitle,
                        { color: theme.text, fontSize: fontSize + 6 },
                    ]}
                >
                    {subtitle}
                </Text>
            </Animated.View>

            {/* 装飾的なグラデーションライン */}
            <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.decorativeLine}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: "#fff",
    },
    avatarText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    notificationButton: {
        position: "relative",
        padding: 8,
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    greeting: {
        fontWeight: "600",
        marginBottom: 2,
    },
    subtitle: {
        fontWeight: "800",
        lineHeight: 28,
    },
    decorativeLine: {
        height: 3,
        borderRadius: 2,
        marginTop: 12,
        width: "30%",
    },
});
