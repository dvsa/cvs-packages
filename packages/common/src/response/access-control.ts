export class AccessControl {
	/**
	 * Access control origin headers:
	 * - AllowAll: Enable CORS support for all origins
	 */
	static OriginHeader = {
		AllowAll: {
			'Access-Control-Allow-Origin': '*' as const,
		},
	};

	/**
	 * Access control headers
	 */
	static Headers: {
		Allow: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token';
	};
}
