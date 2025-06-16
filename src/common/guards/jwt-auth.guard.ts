import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/users/entities/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = User>(err: any, user: any): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    }
    return user as TUser;
  }
}
