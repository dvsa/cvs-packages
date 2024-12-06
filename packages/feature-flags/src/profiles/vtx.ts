import merge from 'lodash.merge';
import { FeatureFlagsClientName } from '..';
import { getFeatureFlags } from '../feature-flags';

const defaultFeatureFlags = {
	welshTranslation: {
		enabled: true,
		translatePassTestResult: true,
		translateFailTestResult: true,
		translatePrsTestResult: true,
	},
	issueDocsCentrally: {
		enabled: true,
	},
	recallsApi: {
		enabled: false,
	},
	automatedCt: {
		enabled: false,
	},
	abandonedCerts: {
		enabled: false,
	}
};

export type FeatureFlags = typeof defaultFeatureFlags;

export const getProfile = async (): Promise<FeatureFlags> => {
	const flags = await getFeatureFlags<FeatureFlags>(FeatureFlagsClientName.VTX);
	return merge(defaultFeatureFlags, flags) as FeatureFlags;
};
