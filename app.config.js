import "dotenv/config";

export default {
  expo: {
    name: "kome_app",
    slug: "kome_app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.kome-app",
      infoPlist: {
        NSCameraUsageDescription:
          "Нужна е камера, за да сканираш баркода на клиентската карта.",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.kome_app",

      // важно за камерата:
      permissions: ["CAMERA"],

      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      favicon: "./assets/favicon.png",
    },
  },
};