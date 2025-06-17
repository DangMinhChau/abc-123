import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to make authentication optional
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Call the parent canActivate method
    return super.canActivate(context);
  }

  // Override handleRequest to not throw error when no user is found
  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, just return null (guest user)
    // Don't throw an error like the parent class would
    if (err || !user) {
      return null;
    }
    return user;
  }
}
