import type { APIGatewayEvent, Context } from 'aws-lambda';
import type { Request } from 'express';
import { JwtAuthoriser } from './verify-jwt';
import type { Action } from 'routing-controllers';
import { AuthError } from './auth-errors';

interface APIGatewayModel {
  event: APIGatewayEvent;
  context: Context;
}

type RoutingControllersRequest = Request & { apiGateway: APIGatewayModel };

export class JWTAuthChecker {
  private static readonly UNAUTHORIZED = 401;

  static async perform({ request }: Action, roles: string | string[] = []): Promise<boolean> {
    // if running locally, skip the token auth and role check
    if (process.env.IS_OFFLINE === 'true') return true;

    // extract the token from the request headers
    const token = (request as RoutingControllersRequest)?.apiGateway.event.headers?.Authorization;

    // if no token is found, then deny access to resource
    if (!token || token.trim()?.length === 0) {
      throw new AuthError(JWTAuthChecker.UNAUTHORIZED, 'Missing Authorization header');
    }

    // Validate the token and extract the roles from it
    const { roles: tokenRoles } = await new JwtAuthoriser(token).validateToken();

    // check if a singular or list of roles were passed into the @Authorized decorator & remove nullish values
    const requiredRoles = (Array.isArray(roles) ? roles : [roles]).filter((role) => !!role);

    // if no roles required, then any valid token can access the resource
    if (requiredRoles.length === 0) return true;

    // if there are no roles in JWT token but roles are required, deny access
    if (!tokenRoles || !Array.isArray(tokenRoles) || tokenRoles.length === 0) {
      throw new AuthError(JWTAuthChecker.UNAUTHORIZED, 'No roles found in token', 'MISSING_ROLES');
    }

    // check if one of the required roles is present in JWT token
    const success = requiredRoles.some((role) => tokenRoles.includes(role));

    if (!success) {
      throw new AuthError(JWTAuthChecker.UNAUTHORIZED, 'Insufficient permissions', 'UNAUTHORIZED', {
        required: requiredRoles,
        actual: tokenRoles,
      });
    }

    return true;
  }
}
