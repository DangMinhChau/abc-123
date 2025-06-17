import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/requests/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'fullName',
        'phoneNumber',
        'role',
        'isActive',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<User> {
    // Check if user exists
    await this.findById(userId);

    // Update user
    await this.userRepository.update(userId, updateData);

    // Return updated user
    return this.findById(userId);
  }
}
