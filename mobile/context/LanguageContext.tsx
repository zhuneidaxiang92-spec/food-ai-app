import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "../constants/translations";

type Language = "ja" | "en";

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations.ja) => string;
    toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps>({
    language: "ja",
    setLanguage: () => { },
    t: (key: any) => key,
    toggleLanguage: () => { },
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("ja");

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const storedLang = await AsyncStorage.getItem("userLanguage");
            if (storedLang === "en" || storedLang === "ja") {
                setLanguageState(storedLang);
            }
        } catch (e) {
            console.log("Failed to load language");
        }
    };

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await AsyncStorage.setItem("userLanguage", lang);
    };

    const toggleLanguage = async () => {
        const newLang = language === "ja" ? "en" : "ja";
        setLanguage(newLang);
    };

    // Translation helper
    const t = (key: keyof typeof translations.ja) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
