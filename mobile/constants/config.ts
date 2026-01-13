// mobile/constants/config.ts

// 開発環境の端末や状況に合わせて変更してください
// ngrokを使用している場合は、そのURLを指定します
export const API_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    "https://cautiously-mesocratic-albert.ngrok-free.dev";

// 末尾のスラッシュを削除する正規化
export const getApiUrl = () => API_URL.replace(/\/$/, "");
