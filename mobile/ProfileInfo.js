import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "./ThemeContext";

export default function ProfileInfo() {
    // ❌ REMOVED <any> (this caused the crash)
    const navigation = useNavigation();
    const { isDark } = useTheme();

    const bg = { backgroundColor: isDark ? "#000" : "#fff" };
    const text = { color: isDark ? "#fff" : "#000" };
    const card = { backgroundColor: isDark ? "#111" : "#f1f1f1" };

    return (
        <View style={[styles.container, bg]}>
            <Text style={[styles.title, text]}>プロフィール情報</Text>

            {/* ✅ プロフィール編集 BUTTON */}
            <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate("Profile")}
            >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.editText}>プロフィールを編集</Text>
            </TouchableOpacity>

            <View style={[styles.box, card]}>
                <Text style={[styles.label, text]}>名前</Text>
                <Text style={[styles.value, text]}>Subhan</Text>

                <Text style={[styles.label, text]}>メール</Text>
                <Text style={[styles.value, text]}>example@email.com</Text>

                <Text style={[styles.label, text]}>電話番号</Text>
                <Text style={[styles.value, text]}>090-1234-5678</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    editBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ff9500",
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        justifyContent: "center",
    },
    editText: {
        color: "#fff",
        marginLeft: 8,
        fontSize: 16,
        fontWeight: "600",
    },
    box: {
        padding: 20,
        borderRadius: 10,
    },
    label: {
        fontWeight: "bold",
        fontSize: 16,
        marginTop: 10,
    },
    value: {
        fontSize: 16,
    },
});
