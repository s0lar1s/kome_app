import { useEffect, useState } from "react";
import { ScrollView, Text, View, Image, StyleSheet } from "react-native";
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

import { bannersApi } from '../Api';

export default function BannersDetails({
    route,
    navigation,
}) {
    const { itemId } = route.params;
    const [banner, setBanner] = useState(null);
    const { width } = useWindowDimensions();

    useEffect(() => {
        bannersApi.getOne(itemId)
            .then(res => {
                setBanner(res.data);
            })
            .catch(err => {
                console.error('Error fetching banner details:', err);
            });
    }, [itemId]);


    return (
        <View style={styles.container}>
            <ScrollView>
                <Image
                    source={{ uri: banner ? `https://kome.bg/komeadmin/banners/images/${banner.image}` : undefined }}
                    style={styles.image}
                    resizeMode="cover"
                />

                <View style={styles.content}>
                    <Text style={styles.name}>{banner?.title}</Text>
                    <RenderHTML
                        contentWidth={width}
                        source={{ html: banner?.content || '' }}
                    />
                    <View style={styles.divider} />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
    },
    image: {
        width: '100%',
        height: 250,
    },
    content: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        marginBottom: 8,
    },
    basePrice: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    qtySection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    qtyLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    addButton: {
        flex: 2,
    },
    viewCartButton: {
        flex: 1,
    },
});
