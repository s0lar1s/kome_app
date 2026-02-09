import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';

const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    error,
    multiline = false,
    numberOfLines = 1,
    style,
    inputStyle,
    editable = true,
}) => {
    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    multiline && { height: numberOfLines * 24 + 24 },
                    error && styles.inputError,
                    !editable && styles.disabled,
                    inputStyle,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                numberOfLines={numberOfLines}
                textAlignVertical={multiline ? 'top' : 'center'}
                editable={editable}
                autoCorrect={false}
                blurOnSubmit={!multiline}
                returnKeyType={multiline ? 'default' : 'done'}
                underlineColorAndroid="transparent"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1e293b',
    },
    multiline: {
        paddingTop: 14,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    disabled: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
});

export default Input;
