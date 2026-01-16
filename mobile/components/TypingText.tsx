// components/TypingText.tsx
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Colors } from "../constants/colors";

type Props = {
  text: string;
  charSpeed?: number;
  sentencePause?: number;
  textStyle?: any;
  skipAnimation?: boolean; // New: Skip animation and show full text immediately
  showSkipButton?: boolean; // New: Show skip button during animation
};

export default function TypingText({
  text,
  charSpeed = 10, // Faster default: 10ms instead of 20ms
  sentencePause = 200, // Faster: 200ms instead of 500ms
  textStyle,
  skipAnimation = false,
  showSkipButton = true,
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(!skipAnimation);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const skipToEnd = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    setDisplayed(text);
    setIsTyping(false);
  };

  useEffect(() => {
    // If skipAnimation is true, show full text immediately
    if (skipAnimation) {
      setDisplayed(text);
      setIsTyping(false);
      return;
    }

    const sentences = text.split(/(?<=[.!?])\s+/);
    let sentenceIndex = 0;

    const typeSentence = (sentence: string) => {
      let charIndex = 0;
      const charInterval = setInterval(() => {
        setDisplayed((prev) => prev + sentence[charIndex]);
        charIndex++;
        if (charIndex >= sentence.length) {
          clearInterval(charInterval);
          sentenceIndex++;
          if (sentenceIndex < sentences.length) {
            setTimeout(() => typeSentence(sentences[sentenceIndex]), sentencePause);
          } else {
            setIsTyping(false);
            setIntervalId(null);
          }
        }
      }, charSpeed);
      setIntervalId(charInterval as any);
    };

    setDisplayed("");
    setIsTyping(true);
    typeSentence(sentences[sentenceIndex]);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setDisplayed("");
    };
  }, [text, skipAnimation]);

  return (
    <View>
      <Text
        style={[
          {
            fontSize: 16,
            lineHeight: 22,
            marginTop: 10,
            color: theme.text,
          },
          textStyle,
        ]}
      >
        {displayed}
        {isTyping && <Text style={{ opacity: 0.4, color: theme.text }}>|</Text>}
      </Text>

      {isTyping && showSkipButton && (
        <TouchableOpacity
          onPress={skipToEnd}
          style={{
            marginTop: 10,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: theme.primary,
            borderRadius: 8,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            全文表示 ⏭
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
