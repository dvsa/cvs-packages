import { createRemoteJWKSet, type JWTPayload, jwtVerify, type JWTVerifyOptions } from 'jose';
import { AuthError } from './auth-errors';

export class JwtAuthoriser {
  private readonly token: string;
  private readonly clientId: string | null;
  private static readonly ENV = process.env.environment?.toUpperCase() ?? '';
  private static readonly tokenExpiryEnvExclusionList = ['DEVELOPMENT', 'NON-PROD'];
  private static readonly JWKS_URI = new URL(
    'https://login.microsoftonline.com/common/discovery/keys'
  );
  private static JWKS = createRemoteJWKSet(JwtAuthoriser.JWKS_URI);

  public constructor(token: string, clientId: string | null = null) {
    this.token = token;
    this.clientId = clientId;
  }

  /**
   * Validate a JWT and return the decoded payload
   * @returns {Promise<JWTPayload>}
   */
  public async validateToken(): Promise<JWTPayload> {
    try {
      const opts: JWTVerifyOptions = {
        clockTolerance: 10,
        algorithms: ['RS256'],
      };

      // issuer validation is handled automatically if present in token
      if (this.clientId) {
        opts.audience = this.clientId;
      }

      if (JwtAuthoriser.tokenExpiryEnvExclusionList.includes(JwtAuthoriser.ENV)) {
        opts.maxTokenAge = Number.POSITIVE_INFINITY;
      }

      const { payload } = await jwtVerify(this.token, JwtAuthoriser.JWKS, opts);

      return payload;
    } catch (err) {
      const error = err as { code?: string };

      const code = 'code' in error ? error.code : '';

      throw new AuthError(401, (err as Error).message, code);
    }
  }
}
