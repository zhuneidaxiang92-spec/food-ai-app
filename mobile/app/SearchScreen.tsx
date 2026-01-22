import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import GlassCard from "../components/GlassCard";
import GlobalWrapper from "../components/GlobalWrapper";

export default function SearchScreen({ navigation }: any) {
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;
    const { fontSize } = useTextSize();
    const { t } = useLanguage();

    const [query, setQuery] = useState("");

    const popularTags = ["Sushi", "Ramen", "Tempura", "Curry", "Udon", "Pizza", "Burger", "Pasta"];

    const handleSearch = () => {
        if (!query.trim()) return;
        Keyboard.dismiss();
        // Navigate to Result screen with the search query as "foodName" mock
        // In a real app, this might go to a dedicated SearchResult list, 
        // but we reuse ResultScreen acting as if we scanned/identified this food.
        // Or simpler: Navigate to a Recipe list.
        // Let's assume we want to find a recipe for this keyword.
        navigation.navigate("Recipe", { recipeName: query });
    };

    const handleTagPress = (tag: string) => {
        setQuery(tag);
        navigation.navigate("Recipe", { recipeName: tag });
    };

    return (
        <GlobalWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 4 }]}>
                    {t("home_search")}
                </Text>
            </View>

            <View style={styles.container}>
                <GlassCard style={styles.searchCard}>
                    <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                        <Ionicons name="search" size={20} color={theme.subtext} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text, fontSize }]}
                            placeholder={t("home_search_placeholder")}
                            placeholderTextColor={theme.subtext}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery("")}>
                                <Ionicons name="close-circle" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        )}
                    </View>
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: theme.text, fontSize }]}>
                    {t("search_popular")}
                </Text>

                <View style={styles.tagsContainer}>
                    {popularTags.map((tag, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.tag, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleTagPress(tag)}
                        >
                            <Text style={[styles.tagText, { color: theme.text }]}>{tag}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </GlobalWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backBtn: {
        marginRight: 15,
    },
    title: {
        fontWeight: "bold",
    },
    container: {
        paddingHorizontal: 20,
    },
    searchCard: {
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: "100%",
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 15,
        marginLeft: 5,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    tag: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
        marginBottom: 10,
    },
    tagText: {
        fontWeight: "500",
    },
});
