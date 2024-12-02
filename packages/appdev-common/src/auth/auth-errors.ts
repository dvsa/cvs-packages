type RoleInfo = { required: string[]; actual: string[] };

export class AuthError extends Error {
  private readonly statusCode: number;
  private readonly code: string;
  private readonly roleInfo?: RoleInfo;

  constructor(
    statusCode: number = 401,
    message: string = 'Authorization failed',
    code: string = 'UNAUTHORIZED',
    roleInfo: RoleInfo | undefined = undefined
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AuthError';
    this.roleInfo = roleInfo ?? undefined;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  public toJSON() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        roleInfo: this.roleInfo,
      },
    };
  }
}
