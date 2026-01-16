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

interface QuickActionProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    delay?: number;
    gradientColors?: [string, string];
}

export default function QuickAction({
    icon,
    label,
    onPress,
    delay = 0,
    gradientColors,
}: QuickActionProps) {
    const { isDark } = useTheme();
    const { fontSize } = useTextSize();
    const theme = isDark ? Colors.dark : Colors.light;

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const pressScale = useSharedValue(1);

    const defaultGradient: [string, string] = [
        theme.accentGradientStart,
        theme.accentGradientEnd,
    ];

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
        scale.value = withDelay(
            delay,
            withSpring(1, { damping: 8, stiffness: 100 })
        );
    }, [delay]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value * pressScale.value }],
    }));

    const handlePressIn = () => {
        pressScale.value = withSpring(0.9, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1, { damping: 10, stiffness: 200 });
        onPress();
    };

    return (
        <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={styles.container}
            delayPressIn={100}
        >
            <Animated.View style={[styles.actionContainer, animatedStyle]}>
                <LinearGradient
                    colors={gradientColors || defaultGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons name={icon} size={28} color="#fff" />
                    </View>
                </LinearGradient>
                <Text
                    style={[styles.label, { color: theme.text, fontSize: fontSize - 2 }]}
                >
                    {label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "48%",
        marginBottom: 12,
    },
    actionContainer: {
        alignItems: "center",
    },
    gradient: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
    },
    label: {
        marginTop: 8,
        fontWeight: "600",
        textAlign: "center",
    },
});
