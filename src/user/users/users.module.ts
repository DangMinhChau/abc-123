import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AdminUsersService } from './admin/admin-users.service';
import { AdminUsersController } from './admin/admin-users.controller';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    forwardRef(() => AuthModule), // For JWT strategy and guards
  ],
  controllers: [AdminUsersController, UsersController],
  providers: [AdminUsersService, UsersService],
  exports: [AdminUsersService, UsersService, TypeOrmModule],
})
export class UsersModule {}
