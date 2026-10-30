import type { Persistence } from 'firebase/auth';

// `firebase/auth` resolves a React Native-specific build at runtime through the
// "react-native" package condition. The published typings only describe the
// browser surface, so this declaration mirrors the RN-only export used by the
// native auth initializer.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
