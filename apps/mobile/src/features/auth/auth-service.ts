export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface PasswordRequirements {
  minimumLength?: number;
  maximumLength?: number;
  lowercaseRequired: boolean;
  uppercaseRequired: boolean;
  numberRequired: boolean;
  nonAlphanumericRequired: boolean;
}

export type AuthStateListener = (user: AuthUser | null) => void;
export type Unsubscribe = () => void;

export interface AuthService {
  observeAuthState(listener: AuthStateListener): Unsubscribe;
  register(input: RegisterInput): Promise<AuthUser>;
  signIn(input: SignInInput): Promise<AuthUser>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string>;
}

export class PasswordPolicyError extends Error {
  constructor(readonly requirements: PasswordRequirements) {
    super('The password does not meet the Firebase password policy.');
    this.name = 'PasswordPolicyError';
  }
}

export class PartialRegistrationError extends Error {
  constructor(readonly user: AuthUser) {
    super('The Firebase account was created, but the display name could not be saved.');
    this.name = 'PartialRegistrationError';
  }
}
