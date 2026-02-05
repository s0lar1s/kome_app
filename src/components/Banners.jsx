import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Banners({ 
    id, 
    image,
    onPress 
}) {

    return (
        <TouchableOpacity onPress={() => onPress(id)}>
            <View style={styles.container}>
                <Image
                    source={{ uri: `https://kome.bg/komeadmin/banners/images/${image}` }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },

    image: {
        width: '100%',
        height: 180,
    },
});
