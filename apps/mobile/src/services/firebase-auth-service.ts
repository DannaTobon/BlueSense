import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  validatePassword,
  type PasswordValidationStatus,
  type User,
} from 'firebase/auth';

import {
  PartialRegistrationError,
  PasswordPolicyError,
  type AuthService,
  type AuthUser,
  type PasswordRequirements,
  type RegisterInput,
  type SignInInput,
} from '@/features/auth/auth-service';

import { firebaseAuth } from './firebase-auth';

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
  };
}

function toPasswordRequirements(status: PasswordValidationStatus): PasswordRequirements {
  const options = status.passwordPolicy.customStrengthOptions;

  return {
    minimumLength: options.minPasswordLength,
    maximumLength: options.maxPasswordLength,
    lowercaseRequired: options.containsLowercaseLetter === true,
    uppercaseRequired: options.containsUppercaseLetter === true,
    numberRequired: options.containsNumericCharacter === true,
    nonAlphanumericRequired: options.containsNonAlphanumericCharacter === true,
  };
}

export const firebaseAuthService: AuthService = {
  observeAuthState(listener) {
    return onAuthStateChanged(firebaseAuth, (user) => {
      listener(user ? toAuthUser(user) : null);
    });
  },

  async register(input: RegisterInput) {
    const passwordStatus = await validatePassword(firebaseAuth, input.password);

    if (!passwordStatus.isValid) {
      throw new PasswordPolicyError(toPasswordRequirements(passwordStatus));
    }

    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      input.email.trim(),
      input.password,
    );

    try {
      await updateProfile(credential.user, { displayName: input.name.trim() });
    } catch {
      throw new PartialRegistrationError(toAuthUser(credential.user));
    }

    return toAuthUser(credential.user);
  },

  async signIn(input: SignInInput) {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      input.email.trim(),
      input.password,
    );
    return toAuthUser(credential.user);
  },

  async signOut() {
    await signOut(firebaseAuth);
  },

  async getIdToken() {
    if (!firebaseAuth.currentUser) {
      throw new Error('No authenticated Firebase user is available.');
    }

    return firebaseAuth.currentUser.getIdToken();
  },
};
