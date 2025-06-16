import { UserRole } from 'src/common/constants/user-role.enum';

export interface JwtPayload {
  /**
   * Subject - User ID
   */
  sub: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's role in the system
   */
  role: UserRole;

  /**
   * Issued at timestamp (optional, automatically added by JWT)
   */
  iat?: number;

  /**
   * Expiration timestamp (optional, automatically added by JWT)
   */
  exp?: number;
}

export interface RefreshTokenPayload {
  /**
   * Subject - User ID
   */
  sub: string;

  /**
   * Token type identifier
   */
  type: 'refresh';

  /**
   * Issued at timestamp (optional, automatically added by JWT)
   */
  iat?: number;

  /**
   * Expiration timestamp (optional, automatically added by JWT)
   */
  exp?: number;
}
