import Constants from 'expo-constants';

type ManifestExtra = {
  firebase?: Record<string, string>;
  openaiFunctionUrl?: string;
  yookassa?: Record<string, string>;
  backendUrl?: string;
};

function getExtra(): ManifestExtra {
  // expoConfig for development, manifest.extra for production builds
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as ManifestExtra;
  if (Object.keys(expoExtra).length > 0) {
    return expoExtra;
  }
  return (Constants.manifest?.extra ?? {}) as ManifestExtra;
}

export const config = {
  firebase: getExtra().firebase ?? {},
  openaiFunctionUrl: getExtra().openaiFunctionUrl ?? '',
  yookassa: getExtra().yookassa ?? {},
  backendUrl: getExtra().backendUrl ?? ''
};
