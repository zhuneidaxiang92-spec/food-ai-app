import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    delay?: number;
}

export default function GlassCard({ children, style, delay = 0 }: GlassCardProps) {
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    useEffect(() => {
        opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.container, style, animatedStyle]}>
            <BlurView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
            />
            <View
                style={[
                    styles.border,
                    { borderColor: theme.glassBorder, borderWidth: 1 },
                ]}
            />
            <View style={styles.content}>{children}</View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: "hidden",
        marginVertical: 10,
        position: "relative",
    },
    border: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
    },
    content: {
        padding: 20,
        zIndex: 1,
    },
});
