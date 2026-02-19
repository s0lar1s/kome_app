import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

console.log("API BASE URL (api.js):", baseURL);

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const raw = await AsyncStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.accessToken;

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // не спираме заявката, просто не слагаме токен
      console.log("Auth token read error:", e?.message || e);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
