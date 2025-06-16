import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { Address } from './entities/address.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}
  async create(
    createAddressDto: CreateAddressDto,
    user: User,
  ): Promise<Address> {
    // If this is set as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { user: { id: user.id }, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
    });

    return this.addressRepository.save(address);
  }
  async findAll(user: User): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: user.id } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAllByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async findDefault(user: User): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { user: { id: user.id }, isDefault: true },
    });
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
    user: User,
  ): Promise<Address> {
    const address = await this.findOne(id, user);

    // If this is set as default, unset other default addresses
    if (updateAddressDto.isDefault) {
      await this.addressRepository.update(
        { user: { id: user.id }, isDefault: true },
        { isDefault: false },
      );
    }
    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(id: string, user: User): Promise<void> {
    const address = await this.findOne(id, user);
    await this.addressRepository.remove(address);
  }
}
