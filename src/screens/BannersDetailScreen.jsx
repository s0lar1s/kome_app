import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { bannersApi } from "../Api";

const BANNER_BASE = "https://kome.bg/komeadmin/banners/images/";

export default function BannersDetails({ route }) {
  const { itemId } = route.params;
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const { width } = useWindowDimensions();
  const contentWidth = width - 32;

  useEffect(() => {
    let mounted = true;

    async function fetchBanner() {
      setLoading(true);
      setFailed(false);

      try {
        const res = await bannersApi.getOne(itemId);
        if (!mounted) return;
        setBanner(res?.data || null);
      } catch (err) {
        if (!mounted) return;
        setFailed(true);
        console.error("Error fetching banner details:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBanner();

    return () => {
      mounted = false;
    };
  }, [itemId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Зареждане...</Text>
      </View>
    );
  }

  if (failed || !banner) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Не успяхме да заредим банера</Text>
        <Text style={styles.errorText}>Моля, опитай отново по-късно.</Text>
      </View>
    );
  }

  const imageUrl = banner?.image ? `${BANNER_BASE}${banner.image}` : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.imagePlaceholderText}>Няма изображение</Text>
            </View>
          )}
        </View>

        <View style={styles.contentCard}>
          {!!banner?.title ? (
            <Text style={styles.name}>{banner.title}</Text>
          ) : null}

          {!!banner?.content ? (
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: banner.content }}
              tagsStyles={{
                body: {
                  color: "#334155",
                  fontSize: 15,
                  lineHeight: 24,
                },
                p: {
                  marginTop: 0,
                  marginBottom: 12,
                  color: "#334155",
                  fontSize: 15,
                  lineHeight: 24,
                },
                h1: {
                  fontSize: 24,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: 12,
                },
                h2: {
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: 10,
                },
                h3: {
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: 8,
                },
                ul: {
                  marginTop: 0,
                  marginBottom: 12,
                  paddingLeft: 18,
                },
                ol: {
                  marginTop: 0,
                  marginBottom: 12,
                  paddingLeft: 18,
                },
                li: {
                  color: "#334155",
                  fontSize: 15,
                  lineHeight: 24,
                  marginBottom: 6,
                },
                strong: {
                  color: "#0f172a",
                  fontWeight: "800",
                },
                a: {
                  color: "#dc2626",
                  textDecorationLine: "none",
                },
              }}
            />
          ) : (
            <Text style={styles.descriptionMuted}>
              Няма допълнителна информация.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
    textAlign: "center",
  },

  heroWrap: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  image: {
    width: "100%",
    height: 240,
    backgroundColor: "#e5e7eb",
  },

  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },

  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },

  contentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  name: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
    lineHeight: 30,
  },

  descriptionMuted: {
    fontSize: 14,
    lineHeight: 22,
    color: "#94a3b8",
  },
});