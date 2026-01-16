import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";

interface StatsCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    value: number;
    label: string;
    onPress?: () => void;
    delay?: number;
    gradientColors?: [string, string];
}

export default function StatsCard({
    icon,
    value,
    label,
    onPress,
    delay = 0,
    gradientColors,
}: StatsCardProps) {
    const { isDark } = useTheme();
    const { fontSize } = useTextSize();
    const theme = isDark ? Colors.dark : Colors.light;

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(1);
    const countValue = useSharedValue(0);

    const defaultGradient: [string, string] = [
        theme.gradientStart,
        theme.gradientEnd,
    ];

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));

        // カウントアップアニメーション
        countValue.value = withDelay(
            delay + 300,
            withTiming(value, { duration: 1000 })
        );
    }, [delay, value]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        onPress?.();
    };

    const content = (
        <Animated.View style={[styles.container, animatedStyle]}>
            <LinearGradient
                colors={gradientColors || defaultGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={32} color="#fff" />
                </View>
                <Text style={[styles.value, { fontSize: fontSize + 8 }]}>
                    {Math.floor(value)}
                </Text>
                <Text style={[styles.label, { fontSize: fontSize - 2 }]}>{label}</Text>
            </LinearGradient>
        </Animated.View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                delayPressIn={100}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        height: 140,
        marginRight: 12,
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    gradient: {
        flex: 1,
        padding: 16,
        justifyContent: "space-between",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    value: {
        color: "#fff",
        fontWeight: "bold",
        marginTop: 8,
    },
    label: {
        color: "#fff",
        opacity: 0.9,
        fontWeight: "600",
    },
});
