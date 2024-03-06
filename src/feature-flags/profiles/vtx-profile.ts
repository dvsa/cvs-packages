type WelshTranslationFeatureFlags = {
  translatePassTestResult: boolean;
  translateFailTestResult: boolean;
  translatePrsTestResult: boolean;
};

export type VTXFeatureFlags = {
  enabled: boolean;
  welshCertificate: WelshTranslationFeatureFlags;
};
