export const APP_NAME: string = 'cvs-app-config';
export const MAX_AGE: number = 60 * 60;

export interface IFeatureFlagsConfig {
  environment: string;
  application: string;
  maxAge: number;
}
