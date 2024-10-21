import { RekognitionClient, type RekognitionClientConfig } from '@aws-sdk/client-rekognition';
import { fromIni } from '@aws-sdk/credential-providers';
import { captureAWSv3Client } from 'aws-xray-sdk';

export class Rekognition {
	private static readonly defaultConfig: Partial<RekognitionClientConfig> = {
		region: 'eu-west-1',
	};

	static getClient(config: Partial<RekognitionClientConfig> = Rekognition.defaultConfig) {
		if (process.env.USE_CREDENTIALS === 'true') {
			config.credentials = fromIni();
		}

		// If tracing is enabled, then capture the client with AWS X-Ray
		return process.env._X_AMZN_TRACE_ID
			? captureAWSv3Client(new RekognitionClient(config))
			: new RekognitionClient(config);
	}
}
