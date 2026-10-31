jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/services/firebase-auth-service', () => ({
  firebaseAuthService: {
    observeAuthState: () => () => {},
    register: async () => {
      throw new Error('Use an injected AuthService in tests.');
    },
    signIn: async () => {
      throw new Error('Use an injected AuthService in tests.');
    },
    signOut: async () => {},
    getIdToken: async () => 'test-token',
  },
}));
