import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";
import { useTextSize } from "../context/TextSizeContext";
import { useLanguage } from "../context/LanguageContext";
import GlassCard from "./GlassCard";

const { height } = Dimensions.get("window");

export interface Notification {
    id: string;
    type: "like" | "comment" | "system";
    userId?: number;
    userName?: string;
    postId?: number;
    message: string;
    timestamp: number;
    read: boolean;
}

interface NotificationCenterProps {
    visible: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function NotificationCenter({
    visible,
    onClose,
    notifications,
    onMarkAsRead,
    onDelete,
}: NotificationCenterProps) {
    const { isDark } = useTheme();
    const { fontSize } = useTextSize();
    const { t } = useLanguage();
    const theme = isDark ? Colors.dark : Colors.light;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "like":
                return { name: "heart", color: "#FF6B9D" };
            case "comment":
                return { name: "chatbubble", color: "#4ECDC4" };
            case "system":
                return { name: "information-circle", color: theme.primary };
            default:
                return { name: "notifications", color: theme.primary };
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t("time_just_now");
        if (minutes < 60) return `${minutes}${t("time_min_ago")}`;
        if (hours < 24) return `${hours}${t("time_hr_ago")}`;
        return `${days}${t("time_day_ago")}`;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView
                    intensity={20}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View
                    style={[
                        styles.container,
                        { backgroundColor: theme.background },
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text
                            style={[
                                styles.title,
                                { color: theme.text, fontSize: fontSize + 4 },
                            ]}
                        >
                            {t("home_notifications")}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Notifications List */}
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons
                                    name="notifications-off-outline"
                                    size={64}
                                    color={theme.subtext}
                                />
                                <Text
                                    style={[
                                        styles.emptyText,
                                        { color: theme.subtext, fontSize: fontSize },
                                    ]}
                                >
                                    {t("notif_no_notifications")}
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notification, index) => {
                                const icon = getNotificationIcon(notification.type);
                                return (
                                    <GlassCard
                                        key={notification.id}
                                        style={[
                                            styles.notificationCard,
                                            !notification.read ? {
                                                borderLeftWidth: 4,
                                                borderLeftColor: theme.primary,
                                            } : undefined,
                                        ] as any}
                                        delay={index * 50}
                                    >
                                        <View style={styles.notificationContent}>
                                            {/* Icon */}
                                            <View
                                                style={[
                                                    styles.iconContainer,
                                                    { backgroundColor: `${icon.color}20` },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={icon.name as any}
                                                    size={24}
                                                    color={icon.color}
                                                />
                                            </View>

                                            {/* Content */}
                                            <View style={styles.textContainer}>
                                                <Text
                                                    style={[
                                                        styles.message,
                                                        {
                                                            color: theme.text,
                                                            fontSize: fontSize,
                                                            fontWeight: notification.read ? "normal" : "600",
                                                        },
                                                    ]}
                                                >
                                                    {notification.message}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.timestamp,
                                                        { color: theme.subtext, fontSize: fontSize - 2 },
                                                    ]}
                                                >
                                                    {formatTimestamp(notification.timestamp)}
                                                </Text>
                                            </View>

                                            {/* Actions */}
                                            <View style={styles.actions}>
                                                {!notification.read && (
                                                    <TouchableOpacity
                                                        onPress={() => onMarkAsRead(notification.id)}
                                                        style={styles.actionButton}
                                                    >
                                                        <Ionicons
                                                            name="checkmark-circle-outline"
                                                            size={20}
                                                            color={theme.primary}
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    onPress={() => onDelete(notification.id)}
                                                    style={styles.actionButton}
                                                >
                                                    <Ionicons
                                                        name="trash-outline"
                                                        size={20}
                                                        color="#FF6B6B"
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </GlassCard>
                                );
                            })
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        height: height * 0.75,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        paddingTop: 24,
        borderBottomWidth: 1,
    },
    title: {
        fontWeight: "bold",
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        textAlign: "center",
    },
    notificationCard: {
        marginBottom: 12,
    },
    notificationContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        lineHeight: 20,
        marginBottom: 4,
    },
    timestamp: {
        opacity: 0.7,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
});
