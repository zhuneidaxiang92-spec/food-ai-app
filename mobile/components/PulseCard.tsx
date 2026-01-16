import React, { useEffect } from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

interface PulseCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    delay?: number;
    onPress?: () => void;
    enablePulse?: boolean;
}

export default function PulseCard({
    children,
    style,
    delay = 0,
    onPress,
    enablePulse = true,
}: PulseCardProps) {
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(1);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        // 初期アニメーション
        opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
        translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));

        // 微細なパルスアニメーション
        if (enablePulse) {
            pulseScale.value = withDelay(
                delay + 500,
                withRepeat(
                    withSequence(
                        withTiming(1.01, { duration: 1500 }),
                        withTiming(1, { duration: 1500 })
                    ),
                    -1,
                    true
                )
            );
        }
    }, [delay, enablePulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value * pulseScale.value },
        ],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { damping: 10, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    };

    const content = (
        <Animated.View style={[styles.container, style, animatedStyle]}>
            <BlurView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View
                style={[
                    styles.border,
                    { borderColor: theme.glassBorder, borderWidth: 1 },
                ]}
            />
            <Animated.View style={styles.content}>{children}</Animated.View>
        </Animated.View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
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
        borderRadius: 24,
        overflow: "hidden",
        marginVertical: 10,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
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
