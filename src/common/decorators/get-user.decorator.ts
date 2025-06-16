import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/user/users/entities/user.entity';

// Interface for authenticated request
export interface AuthenticatedRequest extends Request {
  user: User;
}

// Decorator to get the full user object
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

// Decorator to get just the user ID (most common use case)
export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user.id;
  },
);

// Decorator to get specific user property
export const GetUserProperty = createParamDecorator(
  (property: keyof User, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user[property];
  },
);
