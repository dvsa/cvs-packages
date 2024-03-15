type WelshTranslationFeatureFlags = {
  enabled: boolean;
  translatePassTestResult: boolean;
  translateFailTestResult: boolean;
  translatePrsTestResult: boolean;
};

export type VTXFeatureFlags = {
  welshTranslation: WelshTranslationFeatureFlags;
};
