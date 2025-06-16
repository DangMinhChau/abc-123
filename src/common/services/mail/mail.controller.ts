import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { MailService } from './mail.service';
import {
  SendMailDto,
  SendWelcomeEmailDto,
  SendPasswordResetEmailDto,
  SendOrderConfirmationEmailDto,
  SendOrderStatusUpdateEmailDto,
} from './dto/send-mail.dto';
import { JwtAuthGuard } from 'src/common/guards';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMail(@Body() sendMailDto: SendMailDto) {
    await this.mailService.sendMail(sendMailDto);
    return null;
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  async sendWelcomeEmail(@Body() welcomeEmailDto: SendWelcomeEmailDto) {
    await this.mailService.sendWelcomeEmail(
      welcomeEmailDto.to,
      welcomeEmailDto.userName,
    );
    return null;
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetEmail(
    @Body() passwordResetDto: SendPasswordResetEmailDto,
  ) {
    await this.mailService.sendPasswordResetEmail(
      passwordResetDto.to,
      passwordResetDto.userName,
      passwordResetDto.resetToken,
    );
    return null;
  }

  @Post('order-confirmation')
  @HttpCode(HttpStatus.OK)
  async sendOrderConfirmationEmail(
    @Body() orderConfirmationDto: SendOrderConfirmationEmailDto,
  ) {
    const orderData = {
      orderNumber: orderConfirmationDto.orderNumber,
      customerName: orderConfirmationDto.customerName,
      items: orderConfirmationDto.items,
      total: orderConfirmationDto.total,
      shippingAddress: orderConfirmationDto.shippingAddress,
    };

    await this.mailService.sendOrderConfirmationEmail(
      orderConfirmationDto.to,
      orderData,
    );

    return null;
  }

  @Post('order-status-update')
  @HttpCode(HttpStatus.OK)
  async sendOrderStatusUpdateEmail(
    @Body() statusUpdateDto: SendOrderStatusUpdateEmailDto,
  ) {
    const orderData = {
      orderNumber: statusUpdateDto.orderNumber,
      customerName: statusUpdateDto.customerName,
      status: statusUpdateDto.status,
      trackingNumber: statusUpdateDto.trackingNumber,
    };

    await this.mailService.sendOrderStatusUpdateEmail(
      statusUpdateDto.to,
      orderData,
    );

    return null;
  }
}
