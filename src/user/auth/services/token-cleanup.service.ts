import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserToken } from '../../tokens/entities/token.entity';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @InjectRepository(UserToken)
    private readonly tokenRepository: Repository<UserToken>,
  ) {}

  // Run cleanup every day at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      this.logger.log('Starting expired token cleanup...');

      const result = await this.tokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Successfully cleaned up ${result.affected} expired tokens`,
        );
      } else {
        this.logger.log('No expired tokens found to cleanup');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  // Run cleanup for inactive tokens older than 30 days
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupInactiveTokens(): Promise<void> {
    try {
      this.logger.log('Starting inactive token cleanup...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.tokenRepository.delete({
        isActive: false,
        updatedAt: LessThan(thirtyDaysAgo),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Successfully cleaned up ${result.affected} old inactive tokens`,
        );
      } else {
        this.logger.log('No old inactive tokens found to cleanup');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup inactive tokens:', error);
    }
  }

  // Manual cleanup method for admin use
  async forceCleanup(): Promise<{ expired: number; inactive: number }> {
    try {
      this.logger.log('Starting manual token cleanup...');

      // Cleanup expired tokens
      const expiredResult = await this.tokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });

      // Cleanup old inactive tokens (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const inactiveResult = await this.tokenRepository.delete({
        isActive: false,
        updatedAt: LessThan(sevenDaysAgo),
      });

      const expired = expiredResult.affected || 0;
      const inactive = inactiveResult.affected || 0;

      this.logger.log(
        `Manual cleanup completed: ${expired} expired, ${inactive} inactive tokens removed`,
      );

      return { expired, inactive };
    } catch (error) {
      this.logger.error('Failed manual cleanup:', error);
      throw error;
    }
  }

  // Limit concurrent sessions per user
  async limitConcurrentSessions(
    userId: string,
    maxSessions: number = 5,
  ): Promise<void> {
    try {
      const activeSessions = await this.tokenRepository.find({
        where: {
          user: { id: userId },
          type: 'REFRESH_TOKEN',
          isActive: true,
        },
        order: { createdAt: 'DESC' },
      });

      if (activeSessions.length >= maxSessions) {
        // Keep only the most recent sessions, deactivate the rest
        const sessionsToDeactivate = activeSessions.slice(maxSessions - 1);
        const idsToDeactivate = sessionsToDeactivate.map(
          (session) => session.id,
        );

        if (idsToDeactivate.length > 0) {
          await this.tokenRepository.update(idsToDeactivate, {
            isActive: false,
          });
          this.logger.log(
            `Deactivated ${idsToDeactivate.length} old sessions for user ${userId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to limit concurrent sessions:', error);
    }
  }
}
