    import axios from "axios";

    console.log("API BASE URL (api.js):", process.env.EXPO_PUBLIC_API_URL);

    const api = axios.create({
        baseURL: process.env.EXPO_PUBLIC_API_URL,
        timeout: 10000,
    });

    export default api;

    