export { FeatureFlagsClient } from './feature-flags';

export enum FeatureFlagsClientName {
  VTA = 'vta',
  VTX = 'vtx',
  VTM = 'vtm',
}

type WelshTranslationFeatureFlags = {
  enabled: boolean;
};

type WelshCertificateFeatureFlags = {
  generatePass: {
    enabled: boolean;
  };
  generateFail: {
    enabled: boolean;
  };
  generatePrs: {
    enabled: boolean;
  };
};

export type VTXFeatureFlags = {
  welshTranslation: WelshTranslationFeatureFlags;
  welshCertificate: WelshCertificateFeatureFlags;
};
