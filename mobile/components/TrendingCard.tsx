import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import PulseCard from "./PulseCard";

const { width } = Dimensions.get("window");

interface TrendingCardProps {
    rank: number;
    name: string;
    image?: string;
    onPress: () => void;
    delay?: number;
}

export default function TrendingCard({
    rank,
    name,
    image,
    onPress,
    delay = 0,
}: TrendingCardProps) {
    const { isDark } = useTheme();
    const { fontSize } = useTextSize();
    const theme = isDark ? Colors.dark : Colors.light;

    return (
        <PulseCard
            style={styles.card}
            onPress={onPress}
            delay={delay}
            enablePulse={true}
        >
            {image ? (
                <Image source={{ uri: image }} style={styles.image} />
            ) : (
                <View style={[styles.placeholder, { backgroundColor: theme.border }]}>
                    <Ionicons name="restaurant" size={32} color={theme.subtext} />
                </View>
            )}

            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.overlay}
            >
                {/* Rank Badge */}
                <View style={styles.rankBadge}>
                    <LinearGradient
                        colors={["#FFD700", "#FFA500"]}
                        style={styles.rankGradient}
                    >
                        <Text style={styles.rankText}>#{rank}</Text>
                    </LinearGradient>
                </View>

                {/* Trending Icon */}
                <View style={styles.trendingIcon}>
                    <Text style={styles.fireEmoji}>🔥</Text>
                </View>

                {/* Name */}
                <Text style={[styles.name, { fontSize: fontSize }]} numberOfLines={2}>
                    {name}
                </Text>
            </LinearGradient>
        </PulseCard>
    );
}

const styles = StyleSheet.create({
    card: {
        width: width * 0.35,
        height: 150,
        marginRight: 10,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        paddingTop: 35,
    },
    rankBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: "hidden",
    },
    rankGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    rankText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 13,
    },
    trendingIcon: {
        position: "absolute",
        top: 10,
        right: 10,
    },
    fireEmoji: {
        fontSize: 20,
    },
    name: {
        color: "#fff",
        fontWeight: "bold",
        lineHeight: 18,
    },
});
