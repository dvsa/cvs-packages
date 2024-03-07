type WelshTranslationFeatureFlags = {
  enabled: boolean;
  welshTranslation: {
    translatePassTestResult: boolean;
    translateFailTestResult: boolean;
    translatePrsTestResult: boolean;
  };
};

export type VTXFeatureFlags = {
  welshTranslation: WelshTranslationFeatureFlags;
};
