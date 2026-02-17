import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/auth/useAuth.js';

export default function RegisterScreen({ navigation }) {
  const headerHeight = useHeaderHeight();

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const { register, isLoading, error, clearError } = useAuth();

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Името е задължително';

    if (!email.trim()) {
      newErrors.email = 'Email е задължителен';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Моля въведете валиден email';
    }

    if (!password) {
      newErrors.password = 'Паролата е задължителна';
    } else if (password.length < 4) {
      newErrors.password = 'Паролата трябва да е повече от 4 символа';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Паролите не съвпадат';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;
    await register(email, password, name);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={48} color="#F50000" />
          </View>
          <Text style={styles.title}>Регистрация</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Input
            ref={nameRef}
            label="Име"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="Въведете име"
            autoCapitalize="words"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => emailRef.current?.focus?.()}
            error={errors.name}
          />

          <Input
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="Въведете email"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passRef.current?.focus?.()}
            error={errors.email}
          />

          <Input
            ref={passRef}
            label="Парола"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="Въведете парола"
            secureTextEntry
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus?.()}
            error={errors.password}
          />

          <Input
            ref={confirmRef}
            label="Потвърди паролата"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            placeholder="Потвърдете паролата"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            error={errors.confirmPassword}
          />

          <Button
            title="Създай акаунт"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Вече имате регистрация?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
            <Text style={styles.linkText}>Вход</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorBannerText: {
    flex: 1,
    marginLeft: 8,
    color: '#ef4444',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
  },
  linkText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 10,
  },
});
