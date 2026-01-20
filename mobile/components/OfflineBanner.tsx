import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/colors';

export default function OfflineBanner() {
    const { isConnected } = useNetwork();
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const theme = isDark ? Colors.dark : Colors.light;

    if (isConnected) return null;

    return (
        <View style={[styles.banner, { backgroundColor: theme.warning }]}>
            <Ionicons name="cloud-offline-outline" size={20} color="#fff" />
            <Text style={styles.text}>{t('offline_message')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
    },
    text: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
