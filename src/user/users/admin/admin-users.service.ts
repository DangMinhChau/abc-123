import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/user/users/entities/user.entity';
import { UserRole } from 'src/common/constants/user-role.enum';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from '../dto';

export interface PaginatedUsers {
  data: UserResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  /**
   * Lấy danh sách người dùng với phân trang và lọc
   */
  async findAll(queryDto: UserQueryDto): Promise<PaginatedUsers> {
    try {
      this.logger.log('Finding all users with query:', queryDto);

      const {
        page = 1,
        limit = 10,
        search,
        role,
        isActive,
        isEmailVerified,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = queryDto;

      const queryBuilder: SelectQueryBuilder<User> = this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.fullName',
          'user.email',
          'user.phoneNumber',
          'user.role',
          'user.isActive',
          'user.isEmailVerified',
          'user.createdAt',
          'user.updatedAt',
        ]);

      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(user.fullName LIKE :search OR user.email LIKE :search OR user.phoneNumber LIKE :search)',
          { search: `%${search}%` },
        );
      }

      if (role !== undefined) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive });
      }

      if (isEmailVerified !== undefined) {
        queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', {
          isEmailVerified,
        });
      }

      // Apply sorting
      queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
      this.logger.log('Executing database query...');
      const [users, total] = await queryBuilder.getManyAndCount();
      this.logger.log(`Found ${users.length} users out of ${total} total`);

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: plainToInstance(UserResponseDto, users, {
          excludeExtraneousValues: true,
        }),
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };

      this.logger.log('Successfully returning users list');
      return result;
    } catch (error) {
      this.logger.error('Error fetching users list:', error);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách người dùng',
      );
    }
  }

  /**
   * Lấy thông tin chi tiết người dùng
   */
  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      return plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to get user details:', error);
      throw new InternalServerErrorException(
        'Không thể lấy thông tin người dùng',
      );
    }
  }

  /**
   * Tạo người dùng mới
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Check if email already exists
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }

      // Check if phone number already exists
      const existingUserByPhone = await this.userRepository.findOne({
        where: { phoneNumber: createUserDto.phoneNumber },
      });

      if (existingUserByPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }

      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);

      return plainToInstance(UserResponseDto, savedUser, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create user:', error);
      throw new InternalServerErrorException('Không thể tạo người dùng');
    }
  }

  /**
   * Cập nhật thông tin người dùng
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // Check email uniqueness if email is being updated
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUserByEmail = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });

        if (existingUserByEmail) {
          throw new ConflictException('Email đã được sử dụng');
        }
      } // Check phone number uniqueness if phone is being updated
      if (
        updateUserDto.phoneNumber &&
        updateUserDto.phoneNumber !== user.phoneNumber
      ) {
        const existingUserByPhone = await this.userRepository.findOne({
          where: { phoneNumber: updateUserDto.phoneNumber },
        });

        if (existingUserByPhone) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }
      }

      // Prevent deactivating admin users
      if (updateUserDto.isActive === false && user.role === UserRole.ADMIN) {
        throw new BadRequestException('Không thể vô hiệu hóa tài khoản admin');
      }

      // Update user
      await this.userRepository.update(id, updateUserDto);
      const updatedUser = await this.userRepository.findOne({ where: { id } });

      return plainToInstance(UserResponseDto, updatedUser, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error('Failed to update user:', error);
      throw new InternalServerErrorException('Không thể cập nhật người dùng');
    }
  }

  /**
   * Xóa mềm người dùng
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // Prevent deleting admin users
      if (user.role === UserRole.ADMIN) {
        throw new BadRequestException('Không thể xóa tài khoản admin');
      }

      // Soft delete by setting isActive to false
      await this.userRepository.update(id, {
        isActive: false,
      });

      return { message: 'Xóa người dùng thành công' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Failed to delete user:', error);
      throw new InternalServerErrorException('Không thể xóa người dùng');
    }
  }
}
