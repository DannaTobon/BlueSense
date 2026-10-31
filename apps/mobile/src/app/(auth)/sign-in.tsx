import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { toAuthErrorMessage } from '@/features/auth/auth-errors';
import { hasFieldErrors, validateSignInInput, type FieldErrors } from '@/features/auth/auth-form';
import { useAuthSession } from '@/features/auth/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const theme = useTheme();
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const nextErrors = validateSignInInput({ email, password });

    if (hasFieldErrors(nextErrors)) {
      setErrors(nextErrors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      await signIn({ email, password });
    } catch (error: unknown) {
      setFormError(toAuthErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen title="Iniciar sesión" subtitle="Accede con tu correo y contraseña.">
      <View style={styles.form}>
        <FormField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="tu@correo.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          inputMode="email"
        />

        <FormField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
        />

        {formError ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {formError}
          </ThemedText>
        ) : null}

        <PrimaryButton
          label="Entrar"
          loading={submitting}
          onPress={() => {
            void handleSubmit();
          }}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Aún no tienes cuenta?
        </ThemedText>
        <Link href="/register" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Crear una cuenta">
            <ThemedText type="linkPrimary">Crear una cuenta</ThemedText>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
