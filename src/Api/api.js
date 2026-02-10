    import axios from "axios";

    console.log("API BASE URL (api.js):", process.env.EXPO_PUBLIC_API_URL);

    const api = axios.create({
        // baseURL: "https://kome.bg/api",
        // headers: {
        //     "Content-Type" : "application/json",
        // },
        baseURL: process.env.EXPO_PUBLIC_API_URL,
        timeout: 10000,
    });

    // export const api = axios.create({
    //     baseURL: process.env.EXPO_PUBLIC_API_URL, // напр. https://kome.bg/api
    //     timeout: 10000,
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Accept": "application/json",
    //     },
    //     });

    //     api.interceptors.request.use((config) => {
    //     console.log("➡️ REQUEST", config.method?.toUpperCase(), (config.baseURL || "") + (config.url || ""), config.data);
    //     return config;
    //     });

    //     api.interceptors.response.use(
    //     (res) => {
    //         console.log("✅ RESPONSE", res.status, res.data);
    //         return res;
    //     },
    //     (err) => {
    //         console.log("❌ AXIOS ERROR", err?.message, err?.response?.status, err?.response?.data);
    //         return Promise.reject(err);
    //     }
    //     );

    export default api;

    