import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../constants/colors";
import { getApiUrl } from "../constants/config";

WebBrowser.maybeCompleteAuthSession();

const API_URL = getApiUrl();

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      iosClientId:
        "182333209636-n2h0rqca8ve59qqfadegf0o63qacki40.apps.googleusercontent.com",
      androidClientId:
        "182333209636-rb90shigli8gkarn9l5hn3rgb0njl9rr.apps.googleusercontent.com",
      expoClientId:
        "182333209636-qfto1k7ijvea0bvcnq9r527v8mf3lahu.apps.googleusercontent.com",
    },
    {
      useProxy: true,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const accessToken = response.authentication?.accessToken;
      if (accessToken) {
        handleGoogleLogin(accessToken);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch { }

      if (res.ok) {
        // backend の返却形式が違っても落ちないように吸収
        const userName = data.user?.name ?? data.name ?? "User";
        const userEmail = data.user?.email ?? data.email ?? null;
        const userId = data.user?.id ?? data.user_id ?? null;

        // JWT を返す実装なら access_token を保存、無いなら null
        const jwtToken = data.access_token ?? data.token ?? null;

        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            name: userName,
            access_token: jwtToken,
            email: userEmail,
            id: userId,
            login_provider: "google",
          })
        );

        Alert.alert("ログイン成功", `${userName} さんようこそ！`);
        navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
      } else {
        Alert.alert(
          "ログイン失敗",
          data.detail || data.message || `(${res.status}) ${text}` || "Google ログインに失敗しました"
        );
      }
    } catch (err) {
      Alert.alert("エラー", "Google ログイン通信エラー");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("入力エラー", "メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch { }

      if (res.ok) {
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            name: data.name ?? "User",
            access_token: data.access_token,
            email: email,
            id: data.user_id,
            login_provider: "email",
          })
        );

        Alert.alert("ログイン成功", `${data.name ?? "ユーザー"} さんようこそ！`);
        navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
      } else {
        Alert.alert(
          "ログイン失敗",
          data.detail || data.message || `(${res.status}) ${text}` || "ログインに失敗しました"
        );
      }
    } catch (err) {
      Alert.alert("エラー", "通信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient colors={["#FFF", "#FFF"]} style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={{ fontSize: 40 }}>🥗</Text>
            </View>
            <Text style={styles.appName}>Food AI</Text>
            <Text style={styles.tagline}>あなたの専属シェフ</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>おかえりなさい</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="パスワード"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>ログイン</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Ionicons name="logo-google" size={20} color="#333" />
              <Text style={styles.googleButtonText}>Google でログイン</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>アカウントをお持ちでないですか？</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signUpText}>新規登録</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#111",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#374151",
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 56,
    borderRadius: 12,
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signUpText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
});
