import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensModule } from '../tokens/tokens.module';
import { MailModule } from 'src/common/services/mail/mail.module';
import { UsersModule } from '../users/users.module';
import { UserToken } from '../tokens/entities/token.entity';
import { TokenCleanupService } from './services/token-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRES_IN',
            '1d',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    TokensModule,
    MailModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenCleanupService],
  exports: [AuthService, JwtStrategy, JwtModule],
})
export class AuthModule {}
