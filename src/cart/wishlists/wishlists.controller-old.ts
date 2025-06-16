import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUserId, ResponseMessage } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  @ResponseMessage('Tạo wishlist thành công')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistsService.create(createWishlistDto);
  }

  @Post('add')
  @ResponseMessage('Thêm vào wishlist thành công')
  @HttpCode(HttpStatus.CREATED)
  addToWishlist(
    @GetUserId() userId: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ) {
    return this.wishlistsService.addToWishlist(userId, addToWishlistDto);
  }

  @Post('toggle/:productId')
  @ResponseMessage('Cập nhật wishlist thành công')
  @HttpCode(HttpStatus.OK)
  toggleWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.toggleWishlist(userId, productId);
  }

  @Patch('move-to-cart/:productId')
  @ResponseMessage('Chuyển sang giỏ hàng thành công')
  @HttpCode(HttpStatus.OK)
  moveToCart(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
    @Body() moveToCartDto: Omit<MoveToCartDto, 'productId'>,
  ) {
    return this.wishlistsService.moveToCart(userId, {
      productId,
      ...moveToCartDto,
    });
  }

  @Get()
  @ResponseMessage('Lấy danh sách wishlist thành công')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.wishlistsService.findAll();
  }

  @Get('my-wishlist')
  @ResponseMessage('Lấy wishlist của tôi thành công')
  getMyWishlist(@GetUserId() userId: string) {
    return this.wishlistsService.findByUserId(userId);
  }

  @Get('count')
  @ResponseMessage('Lấy số lượng wishlist thành công')
  getWishlistCount(@GetUserId() userId: string) {
    return this.wishlistsService.getWishlistCount(userId);
  }

  @Get('check/:productId')
  @ResponseMessage('Kiểm tra sản phẩm trong wishlist thành công')
  checkInWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.isInWishlist(userId, productId);
  }

  @Get(':id')
  @ResponseMessage('Lấy thông tin wishlist thành công')
  findOne(@Param('id') id: string) {
    return this.wishlistsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật wishlist thành công')
  update(
    @Param('id') id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ) {
    return this.wishlistsService.update(id, updateWishlistDto);
  }

  @Delete('clear')
  @ResponseMessage('Xóa toàn bộ wishlist thành công')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearWishlist(@GetUserId() userId: string) {
    return this.wishlistsService.clearWishlist(userId);
  }

  @Delete('remove/:productId')
  @ResponseMessage('Xóa sản phẩm khỏi wishlist thành công')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFromWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.removeFromWishlist(userId, productId);
  }

  @Delete(':id')
  @ResponseMessage('Xóa wishlist thành công')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.wishlistsService.remove(id);
  }
}
