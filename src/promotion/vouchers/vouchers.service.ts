import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/responses';
import { Voucher } from './entities/voucher.entity';
import { DiscountType } from 'src/common/constants/discount-type.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

export interface VoucherQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  discountType?: DiscountType;
}

export interface VoucherValidationResult {
  isValid: boolean;
  voucher?: Voucher;
  error?: string;
  discountAmount?: number;
}

@Injectable()
export class VouchersService {
  private readonly logger = new Logger(VouchersService.name);

  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // Validate dates
    if (createVoucherDto.startAt >= createVoucherDto.expireAt) {
      throw new BadRequestException('Start date must be before expire date');
    }

    // Validate discount configuration
    if (createVoucherDto.discountType === DiscountType.AMOUNT) {
      if (
        !createVoucherDto.discountAmount ||
        createVoucherDto.discountPercent
      ) {
        throw new BadRequestException(
          'For amount discount, only discountAmount should be provided',
        );
      }
    } else if (createVoucherDto.discountType === DiscountType.PERCENT) {
      if (
        !createVoucherDto.discountPercent ||
        createVoucherDto.discountAmount
      ) {
        throw new BadRequestException(
          'For percent discount, only discountPercent should be provided',
        );
      }
    }

    // Check if voucher code already exists
    const existingVoucher = await this.voucherRepository.findOne({
      where: { code: createVoucherDto.code },
    });

    if (existingVoucher) {
      throw new ConflictException('Voucher code already exists');
    }

    try {
      const voucher = this.voucherRepository.create(createVoucherDto);
      const savedVoucher = await this.voucherRepository.save(voucher);

      this.logger.log(`Created voucher with code: ${savedVoucher.code}`);
      return savedVoucher;
    } catch (error) {
      this.logger.error(
        `Failed to create voucher: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to create voucher');
    }
  }
  async findAll(query: VoucherQueryDto = {}): Promise<{
    data: Voucher[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search, isActive, discountType } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');

    if (search) {
      queryBuilder.where(
        'voucher.code LIKE :search OR voucher.description LIKE :search',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('voucher.isActive = :isActive', { isActive });
    }

    if (discountType) {
      queryBuilder.andWhere('voucher.discountType = :discountType', {
        discountType,
      });
    }
    const [vouchers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('voucher.createdAt', 'DESC')
      .getManyAndCount();
    return {
      data: vouchers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return voucher;
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.voucherRepository.findOne({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    return voucher;
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucher = await this.findOne(id);

    // Validate dates if provided
    const startAt = updateVoucherDto.startAt || voucher.startAt;
    const expireAt = updateVoucherDto.expireAt || voucher.expireAt;

    if (startAt >= expireAt) {
      throw new BadRequestException('Start date must be before expire date');
    }

    // Validate discount configuration if discount type is being changed
    const discountType = updateVoucherDto.discountType || voucher.discountType;

    if (updateVoucherDto.discountType) {
      if (discountType === DiscountType.AMOUNT) {
        if (updateVoucherDto.discountPercent !== undefined) {
          throw new BadRequestException(
            'Cannot set discountPercent for amount discount type',
          );
        }
      } else if (discountType === DiscountType.PERCENT) {
        if (updateVoucherDto.discountAmount !== undefined) {
          throw new BadRequestException(
            'Cannot set discountAmount for percent discount type',
          );
        }
      }
    }

    // Check if new code conflicts with existing vouchers
    if (updateVoucherDto.code && updateVoucherDto.code !== voucher.code) {
      const existingVoucher = await this.voucherRepository.findOne({
        where: { code: updateVoucherDto.code },
      });

      if (existingVoucher) {
        throw new ConflictException('Voucher code already exists');
      }
    }

    try {
      Object.assign(voucher, updateVoucherDto);
      const updatedVoucher = await this.voucherRepository.save(voucher);

      this.logger.log(`Updated voucher with code: ${updatedVoucher.code}`);
      return updatedVoucher;
    } catch (error) {
      this.logger.error(
        `Failed to update voucher: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to update voucher');
    }
  }

  async remove(id: string): Promise<void> {
    const voucher = await this.findOne(id);

    try {
      await this.voucherRepository.remove(voucher);
      this.logger.log(`Deleted voucher with code: ${voucher.code}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete voucher: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to delete voucher');
    }
  }

  async toggleStatus(id: string): Promise<Voucher> {
    const voucher = await this.findOne(id);
    voucher.isActive = !voucher.isActive;

    const updatedVoucher = await this.voucherRepository.save(voucher);
    this.logger.log(
      `Toggled voucher ${voucher.code} status to: ${voucher.isActive}`,
    );

    return updatedVoucher;
  }

  async validateVoucher(
    code: string,
    orderTotal: number,
  ): Promise<VoucherValidationResult> {
    try {
      const voucher = await this.findByCode(code);

      if (!voucher.isValidForUse()) {
        return {
          isValid: false,
          error:
            'Voucher is not valid for use (expired, inactive, or usage limit exceeded)',
        };
      }

      if (voucher.minOrderAmount && orderTotal < voucher.minOrderAmount) {
        return {
          isValid: false,
          error: `Minimum order amount is ${voucher.minOrderAmount}`,
        };
      }

      const discountAmount = voucher.calculateDiscount(orderTotal);

      return {
        isValid: true,
        voucher,
        discountAmount,
      };
    } catch {
      return {
        isValid: false,
        error: 'Voucher not found',
      };
    }
  }

  async applyVoucher(
    code: string,
    orderTotal: number,
  ): Promise<{
    voucher: Voucher;
    discountAmount: number;
  }> {
    const validation = await this.validateVoucher(code, orderTotal);

    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    return {
      voucher: validation.voucher!,
      discountAmount: validation.discountAmount!,
    };
  }

  async incrementUsage(voucherId: string): Promise<void> {
    try {
      await this.voucherRepository.increment(
        { id: voucherId },
        'usageCount',
        1,
      );
      this.logger.log(`Incremented usage count for voucher: ${voucherId}`);
    } catch (error) {
      this.logger.error(
        `Failed to increment voucher usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new BadRequestException('Failed to update voucher usage');
    }
  }
  async getVoucherStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
    totalUsage: number;
  }> {
    const now = new Date();

    const [total, active, expired] = await Promise.all([
      this.voucherRepository.count(),
      this.voucherRepository.count({
        where: {
          isActive: true,
          startAt: LessThanOrEqual(now),
          expireAt: MoreThanOrEqual(now),
        },
      }),
      this.voucherRepository.count({
        where: {
          expireAt: LessThanOrEqual(now),
        },
      }),
    ]);
    const usageResult: { totalUsage: string } | undefined =
      await this.voucherRepository
        .createQueryBuilder('voucher')
        .select('SUM(voucher.usageCount)', 'totalUsage')
        .getRawOne();

    return {
      total,
      active,
      expired,
      totalUsage: parseInt(usageResult?.totalUsage || '0') || 0,
    };
  }

  async getActiveVouchers(): Promise<Voucher[]> {
    const now = new Date();

    return this.voucherRepository.find({
      where: {
        isActive: true,
        startAt: LessThanOrEqual(now),
        expireAt: MoreThanOrEqual(now),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // DTO transformation methods
  toVoucherResponseDto(voucher: Voucher): VoucherResponseDto {
    const discountValue =
      voucher.discountType === DiscountType.AMOUNT
        ? voucher.discountAmount || 0
        : voucher.discountPercent || 0;

    return plainToInstance(
      VoucherResponseDto,
      {
        ...voucher,
        discountType: voucher.discountType.toLowerCase(), // Ensure lowercase
        discountValue: discountValue,
        minOrderValue: voucher.minOrderAmount,
        usedCount: voucher.usageCount,
        startDate: voucher.startAt,
        endDate: voucher.expireAt,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  // Update service methods to return DTOs wrapped in BaseResponseDto
  async findAllWithDto(
    query: VoucherQueryDto = {},
  ): Promise<PaginatedResponseDto<VoucherResponseDto>> {
    const result = await this.findAll(query);
    return {
      message: 'Vouchers retrieved successfully',
      data: result.data.map((voucher) => this.toVoucherResponseDto(voucher)),
      meta: {
        ...result.meta,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async findOneWithDto(
    id: string,
  ): Promise<BaseResponseDto<VoucherResponseDto>> {
    const voucher = await this.findOne(id);
    return {
      message: 'Voucher retrieved successfully',
      data: this.toVoucherResponseDto(voucher),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getActiveVouchersWithDto(): Promise<
    BaseResponseDto<VoucherResponseDto[]>
  > {
    const vouchers = await this.getActiveVouchers();
    return {
      message: 'Active vouchers retrieved successfully',
      data: vouchers.map((voucher) => this.toVoucherResponseDto(voucher)),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
