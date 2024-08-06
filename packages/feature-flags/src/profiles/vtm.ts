import merge from 'lodash.merge';
import { FeatureFlagsClientName } from '..';
import { getFeatureFlags } from '../feature-flags';

const defaultFeatureFlags = {};

export type FeatureFlags = typeof defaultFeatureFlags;

export const getProfile = async () => {
	const flags = await getFeatureFlags<FeatureFlags>(FeatureFlagsClientName.VTM);
	return merge(defaultFeatureFlags, flags);
};
