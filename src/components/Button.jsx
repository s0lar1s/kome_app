import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    style,
}) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'secondary' && styles.buttonSecondary,
                variant === 'outline' && styles.buttonOutline,
                disabled && styles.buttonDisabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Text
                style={[
                    styles.text,
                    variant === 'secondary' && styles.textSecondary,
                    variant === 'outline' && styles.textOutline,
                    disabled && styles.textDisabled,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#f5f5f5',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    textSecondary: {
        color: '#333',
    },
    textOutline: {
        color: '#007AFF',
    },
    textDisabled: {
        color: '#999',
    },
});
