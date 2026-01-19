import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../context/ThemeContext";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import { Colors } from "../constants/colors";
import { getApiUrl } from "../constants/config";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import GlobalWrapper from "../components/GlobalWrapper";

const API_URL = getApiUrl();

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;
    const { fontSize } = useTextSize();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    // Profile data
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (!storedUser) {
                navigation.navigate("Login");
                return;
            }

            const user = JSON.parse(storedUser);
            console.log("Loading profile for user ID:", user.id);
            setUserId(user.id);

            // Fetch latest profile from backend
            const url = `${API_URL}/api/users/${user.id}`;
            console.log("Fetching profile from:", url);

            const res = await fetch(url);
            console.log("Response status:", res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Profile fetch failed:", res.status, errorText);
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            console.log("Profile data received:", data);

            setName(data.name || "");
            setEmail(data.email || "");
            setProfileImage(data.profile_image ? `${API_URL}${data.profile_image}` : null);

            setLoading(false);
        } catch (e: any) {
            console.error("Error loading profile:", e);
            setLoading(false);

            // より詳細なエラーメッセージを表示
            const errorMessage = e.message || t("profile_load_error");
            Alert.alert(
                t("profile_error"),
                `${t("profile_load_error")}\n\n詳細: ${errorMessage}`
            );
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(t("profile_permission"), t("profile_permission_msg"));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (e) {
            console.log("Error picking image:", e);
            Alert.alert(t("profile_error"), t("profile_image_error"));
        }
    };

    const uploadImage = async (uri: string) => {
        if (!userId) return;

        try {
            setSaving(true);

            const filename = uri.split("/").pop() || "profile.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : "image/jpeg";

            const formData = new FormData();
            formData.append("file", {
                uri,
                name: filename,
                type,
            } as any);

            const res = await fetch(`${API_URL}/api/users/${userId}/profile-image`, {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const data = await res.json();
            if (res.ok) {
                setProfileImage(`${API_URL}${data.profile_image}`);
                Alert.alert(t("profile_success"), t("profile_image_updated"));
            } else {
                Alert.alert(t("profile_error"), data.detail || t("profile_upload_error"));
            }
        } catch (e) {
            console.log("Error uploading image:", e);
            Alert.alert(t("profile_error"), t("profile_upload_error"));
        }
        setSaving(false);
    };

    const saveProfile = async () => {
        if (!userId) return;

        if (!name.trim() || !email.trim()) {
            Alert.alert(t("profile_error"), t("profile_required_fields"));
            return;
        }

        try {
            setSaving(true);

            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            const data = await res.json();
            if (res.ok) {
                // Update stored user data
                await AsyncStorage.setItem("user", JSON.stringify(data.user));
                Alert.alert(t("profile_success"), t("profile_updated"));
            } else {
                Alert.alert(t("profile_error"), data.detail || t("profile_save_error"));
            }
        } catch (e) {
            console.log("Error saving profile:", e);
            Alert.alert(t("profile_error"), t("profile_save_error"));
        }
        setSaving(false);
    };

    const changePassword = async () => {
        if (!userId) return;

        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert(t("profile_error"), t("profile_password_required"));
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t("profile_error"), t("profile_password_mismatch"));
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert(t("profile_error"), t("profile_password_short"));
            return;
        }

        try {
            setSaving(true);

            const res = await fetch(`${API_URL}/api/users/${userId}/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                Alert.alert(t("profile_success"), t("profile_password_changed"));
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowPasswordSection(false);
            } else {
                Alert.alert(t("profile_error"), data.detail || t("profile_password_error"));
            }
        } catch (e) {
            console.log("Error changing password:", e);
            Alert.alert(t("profile_error"), t("profile_password_error"));
        }
        setSaving(false);
    };

    const confirmDeleteAccount = () => {
        Alert.alert(
            t("profile_delete_account"),
            t("profile_delete_warning"),
            [
                { text: t("profile_cancel"), style: "cancel" },
                {
                    text: t("profile_delete"),
                    style: "destructive",
                    onPress: () => secondConfirmDelete(),
                },
            ]
        );
    };

    const secondConfirmDelete = () => {
        Alert.alert(
            t("profile_delete_confirm_title"),
            t("profile_delete_confirm_msg"),
            [
                { text: t("profile_cancel"), style: "cancel" },
                {
                    text: t("profile_delete_permanently"),
                    style: "destructive",
                    onPress: deleteAccount,
                },
            ]
        );
    };

    const deleteAccount = async () => {
        if (!userId) return;

        try {
            setSaving(true);

            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                // Clear all local data
                await AsyncStorage.multiRemove(["user", "access_token", "favorites", "history"]);
                Alert.alert(t("profile_success"), t("profile_deleted"), [
                    {
                        text: "OK",
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Login" }],
                            });
                        },
                    },
                ]);
            } else {
                Alert.alert(t("profile_error"), t("profile_delete_error"));
            }
        } catch (e) {
            console.log("Error deleting account:", e);
            Alert.alert(t("profile_error"), t("profile_delete_error"));
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <GlobalWrapper>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </GlobalWrapper>
        );
    }

    return (
        <GlobalWrapper>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text, fontSize: fontSize + 4 }]}>
                        {t("profile_title")}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Image */}
                <GlassCard style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.imagePlaceholder, { backgroundColor: theme.border }]}>
                                <Ionicons name="person" size={60} color={theme.subtext} />
                            </View>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.imageHint, { color: theme.subtext, fontSize: fontSize - 2 }]}>
                        {t("profile_tap_change")}
                    </Text>
                </GlassCard>

                {/* Basic Info */}
                <GlassCard style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                        {t("profile_basic_info")}
                    </Text>

                    <Text style={[styles.label, { color: theme.text, fontSize }]}>{t("profile_name")}</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder={t("profile_name_placeholder")}
                        placeholderTextColor={theme.subtext}
                        style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                        ]}
                    />

                    <Text style={[styles.label, { color: theme.text, fontSize }]}>{t("profile_email")}</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t("profile_email_placeholder")}
                        placeholderTextColor={theme.subtext}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                        ]}
                    />

                    <AnimatedButton
                        title={t("profile_save")}
                        onPress={saveProfile}
                        primary
                        disabled={saving}
                    />
                </GlassCard>

                {/* Password Change */}
                <GlassCard style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setShowPasswordSection(!showPasswordSection)}
                    >
                        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: fontSize + 2 }]}>
                            {t("profile_change_password")}
                        </Text>
                        <Ionicons
                            name={showPasswordSection ? "chevron-up" : "chevron-down"}
                            size={24}
                            color={theme.text}
                        />
                    </TouchableOpacity>

                    {showPasswordSection && (
                        <View style={styles.passwordSection}>
                            <Text style={[styles.label, { color: theme.text, fontSize }]}>
                                {t("profile_current_password")}
                            </Text>
                            <TextInput
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder=""
                                placeholderTextColor={theme.subtext}
                                secureTextEntry
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.background,
                                    },
                                ]}
                            />

                            <Text style={[styles.label, { color: theme.text, fontSize }]}>
                                {t("profile_new_password")}
                            </Text>
                            <TextInput
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder=""
                                placeholderTextColor={theme.subtext}
                                secureTextEntry
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.background,
                                    },
                                ]}
                            />

                            <Text style={[styles.label, { color: theme.text, fontSize }]}>
                                {t("profile_confirm_password")}
                            </Text>
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder=""
                                placeholderTextColor={theme.subtext}
                                secureTextEntry
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        borderColor: theme.border,
                                        backgroundColor: theme.background,
                                    },
                                ]}
                            />

                            <AnimatedButton
                                title={t("profile_update_password")}
                                onPress={changePassword}
                                primary
                                disabled={saving}
                            />
                        </View>
                    )}
                </GlassCard>

                {/* Danger Zone */}
                <GlassCard style={StyleSheet.flatten([styles.section, styles.dangerSection, { borderColor: theme.danger }])}>
                    <Text style={[styles.sectionTitle, { color: theme.danger, fontSize: fontSize + 2 }]}>
                        {t("profile_danger_zone")}
                    </Text>
                    <Text style={[styles.dangerText, { color: theme.subtext, fontSize: fontSize - 1 }]}>
                        {t("profile_danger_warning")}
                    </Text>

                    <TouchableOpacity
                        style={[styles.deleteBtn, { backgroundColor: theme.danger }]}
                        onPress={confirmDeleteAccount}
                        disabled={saving}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteBtnText}>{t("profile_delete_account")}</Text>
                    </TouchableOpacity>
                </GlassCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </GlobalWrapper>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontWeight: "bold",
    },

    imageSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        alignItems: "center",
        paddingVertical: 30,
    },
    imageContainer: {
        position: "relative",
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
    },
    editBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#fff",
    },
    imageHint: {
        marginTop: 12,
        textAlign: "center",
    },

    section: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontWeight: "bold",
        marginBottom: 15,
    },

    label: {
        marginBottom: 8,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        fontSize: 16,
    },

    passwordSection: {
        marginTop: 15,
    },

    dangerSection: {
        borderWidth: 2,
    },
    dangerText: {
        marginBottom: 16,
        lineHeight: 20,
    },
    deleteBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    deleteBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
