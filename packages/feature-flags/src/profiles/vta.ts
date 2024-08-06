import merge from 'lodash.merge';
import { FeatureFlagsClientName } from '..';
import { getFeatureFlags } from '../feature-flags';

const defaultFeatureFlags = {
	adr: {
		enabled: false,
	},
	iva: {
		enabled: false,
	},
};

export type FeatureFlags = typeof defaultFeatureFlags;

export const getProfile = async (): Promise<FeatureFlags> => {
	const flags = await getFeatureFlags<FeatureFlags>(FeatureFlagsClientName.VTA);
	return merge(defaultFeatureFlags, flags) as FeatureFlags;
};
