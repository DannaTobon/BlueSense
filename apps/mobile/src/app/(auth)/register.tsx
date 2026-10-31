import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { FormField } from '@/components/form-field';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { toAuthErrorMessage } from '@/features/auth/auth-errors';
import {
  describePasswordRequirements,
  hasFieldErrors,
  validateRegistrationInput,
  type FieldErrors,
} from '@/features/auth/auth-form';
import { PasswordPolicyError } from '@/features/auth/auth-service';
import { useAuthSession } from '@/features/auth/auth-session';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const { register } = useAuthSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    const nextErrors = validateRegistrationInput({ name, email, password });

    if (hasFieldErrors(nextErrors)) {
      setErrors(nextErrors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      await register({ name, email, password });
    } catch (error: unknown) {
      if (error instanceof PasswordPolicyError) {
        setFormError(describePasswordRequirements(error.requirements));
      } else {
        setFormError(toAuthErrorMessage(error));
      }

      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Crear cuenta"
      subtitle="Registra tu nombre, correo y contraseña para empezar."
    >
      <View style={styles.form}>
        <FormField
          label="Nombre"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Tu nombre"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />

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
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <ThemedText type="small" themeColor="textSecondary">
          La contraseña se valida con la política vigente de Firebase. No se recorta ni se
          transforma.
        </ThemedText>

        {formError ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {formError}
          </ThemedText>
        ) : null}

        <PrimaryButton
          label="Crear cuenta"
          loading={submitting}
          onPress={() => {
            void handleSubmit();
          }}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Ya tienes cuenta?
        </ThemedText>
        <Link href="/sign-in" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Iniciar sesión">
            <ThemedText type="linkPrimary">Iniciar sesión</ThemedText>
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
