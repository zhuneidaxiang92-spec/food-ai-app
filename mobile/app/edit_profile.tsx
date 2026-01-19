import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useTextSize } from "../context/TextSizeContext";
import { Colors } from "../constants/colors";
import { getApiUrl } from "../constants/config";

const API_URL = getApiUrl();

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;
    const { t } = useLanguage();
    const { fontSize } = useTextSize();

    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userStr = await AsyncStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserName(user.name || "");
                setUserId(user.id);
                setAccessToken(user.access_token);
                // Handle profile image if exists
                if (user.profile_image) {
                    // Check if full URL or relative
                    if (user.profile_image.startsWith("http")) {
                        setProfileImage(user.profile_image);
                    } else {
                        setProfileImage(`${API_URL}/${user.profile_image}`);
                    }
                }
            }
        } catch (e) {
            console.log("Failed to load user", e);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setLocalImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!accessToken) {
            Alert.alert("Error", "Not logged in");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            if (userName) formData.append("name", userName);
            if (password) formData.append("password", password);

            if (localImageUri) {
                const filename = localImageUri.split('/').pop() || "profile.jpg";
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formData.append("profile_image", {
                    uri: localImageUri,
                    name: filename,
                    type,
                });
            }

            const res = await fetch(`${API_URL}/auth/users/me`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                // Update AsyncStorage
                const userStr = await AsyncStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const updatedUser = {
                        ...user,
                        name: data.name || user.name,
                        profile_image: data.profile_image || user.profile_image,
                    };
                    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
                }

                Alert.alert(t("edit_profile_success"));
                navigation.goBack();
            } else {
                Alert.alert(t("edit_profile_error"), data.detail || "Failed");
            }
        } catch (e: any) {
            Alert.alert(t("edit_profile_error"), e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 4 }]}>
                    {t("edit_profile_title")}
                </Text>
            </View>

            <View style={styles.content}>
                {/* Profile Image */}
                <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={pickImage}>
                        {localImageUri ? (
                            <Image source={{ uri: localImageUri }} style={styles.profileImage} />
                        ) : profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profilePlaceholder, { backgroundColor: theme.border }]}>
                                <Ionicons name="person" size={60} color={theme.subtext} />
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.changePhotoText, { color: theme.primary }]}>
                        {t("edit_profile_change_photo")}
                    </Text>
                </View>

                {/* Inputs */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text, fontSize }]}>{t("edit_profile_nickname")}</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.card,
                            color: theme.text,
                            borderColor: theme.border
                        }]}
                        value={userName}
                        onChangeText={setUserName}
                        placeholderTextColor={theme.subtext}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text, fontSize }]}>{t("edit_profile_password")}</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.card,
                            color: theme.text,
                            borderColor: theme.border
                        }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="********"
                        placeholderTextColor={theme.subtext}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>{t("edit_profile_save")}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontWeight: "bold",
    },
    content: {
        padding: 20,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    profilePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF', // Or theme primary
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: {
        marginTop: 10,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
    },
    saveButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
