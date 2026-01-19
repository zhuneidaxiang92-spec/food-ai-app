import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

interface AnimatedButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    primary?: boolean;
    disabled?: boolean;
}

export default function AnimatedButton({
    title,
    onPress,
    icon,
    primary = true,
    disabled = false,
}: AnimatedButtonProps) {
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (disabled) return;
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        if (disabled) return;
        scale.value = withSpring(1);
        onPress();
    };

    return (
        <Animated.View style={[styles.container, animatedStyle, disabled && { opacity: 0.5 }]}>
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled}>
                <LinearGradient
                    colors={
                        primary
                            ? [theme.gradientStart, theme.gradientEnd]
                            : [isDark ? "#374151" : "#E5E7EB", isDark ? "#1F2937" : "#D1D5DB"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                >
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={primary ? "#fff" : theme.text}
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text
                        style={[
                            styles.text,
                            { color: primary ? "#fff" : theme.text },
                        ]}
                    >
                        {title}
                    </Text>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginVertical: 8,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 30,
    },
    text: {
        fontSize: 16,
        fontWeight: "600",
    },
});
