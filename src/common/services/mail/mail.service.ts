import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';

interface SendMailResult {
  messageId: string;
  envelope: {
    from: string;
    to: string[];
  };
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null;
  constructor(private readonly configService: ConfigService) {
    void this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GMAIL_CLIENT_ID'),
        this.configService.get<string>('GMAIL_CLIENT_SECRET'),
        'https://developers.google.com/oauthplayground', // Redirect URL
      );

      oauth2Client.setCredentials({
        refresh_token: this.configService.get<string>('GMAIL_REFRESH_TOKEN'),
      });

      // Get access token
      const accessToken = await oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: this.configService.get<string>('EMAIL_FROM'),
          clientId: this.configService.get<string>('GMAIL_CLIENT_ID'),
          clientSecret: this.configService.get<string>('GMAIL_CLIENT_SECRET'),
          refreshToken: this.configService.get<string>('GMAIL_REFRESH_TOKEN'),
          accessToken: accessToken.token,
        },
      } as nodemailer.TransportOptions);

      // Verify connection
      await this.transporter.verify();
      this.logger.log('Mail service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize mail service:', error);
      this.logger.warn(
        'Mail service will be disabled. Email functionality will not be available.',
      );
      // Don't throw error - allow application to continue without mail service
      this.transporter = null;
    }
  }
  async sendMail(mailOptions: MailOptions): Promise<void> {
    try {
      if (!this.transporter) {
        this.logger.warn(
          'Mail service not initialized. Email will not be sent.',
        );
        return;
      }

      const from = this.configService.get<string>('EMAIL_FROM');

      const toAddress = Array.isArray(mailOptions.to)
        ? mailOptions.to.join(', ')
        : mailOptions.to;

      const message = {
        from: from,
        to: toAddress,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html,
        attachments: mailOptions.attachments,
      };
      const result = (await this.transporter.sendMail(
        message,
      )) as SendMailResult;
      this.logger.log(
        `Email sent successfully to ${toAddress}. Message ID: ${result?.messageId || 'unknown'}`,
      );
    } catch (error) {
      const toAddress = Array.isArray(mailOptions.to)
        ? mailOptions.to.join(', ')
        : mailOptions.to;
      this.logger.error(`Failed to send email to ${toAddress}:`, error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào mừng bạn đến với cửa hàng của chúng tôi!</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi rất vui mừng được chào đón bạn!</p>
        <p>Bạn có thể bắt đầu mua sắm ngay bây giờ và khám phá những sản phẩm tuyệt vời của chúng tôi.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Chào mừng bạn đến với cửa hàng!',
      html,
    });
  }

  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực tài khoản</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại cửa hàng của chúng tôi!</p>
        <p>Để hoàn tất quá trình đăng ký, vui lòng click vào link sau để xác thực email:</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Xác thực tài khoản
          </a>
        </p>
        <p>Link này sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không thể click vào nút trên, vui lòng copy và paste link sau vào trình duyệt:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
          ${verificationUrl}
        </p>
        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Xác thực tài khoản - Chào mừng bạn đến với cửa hàng!',
      html,
    });
  }
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${userName}</strong>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Vui lòng click vào link sau để đặt lại mật khẩu:</p>
        <p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Link này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: 'Đặt lại mật khẩu',
      html,
    });
  }

  async sendOrderConfirmationEmail(
    to: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: number }>;
      total: number;
      shippingAddress: string;
    },
  ): Promise<void> {
    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác nhận đơn hàng #${orderData.orderNumber}</h2>
        <p>Xin chào <strong>${orderData.customerName}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng! Dưới đây là thông tin chi tiết đơn hàng của bạn:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Số lượng</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px; font-weight: bold; text-align: right;">Tổng cộng:</td>
              <td style="padding: 12px; font-weight: bold; text-align: right; color: #007bff;">${orderData.total.toLocaleString('vi-VN')}đ</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin: 20px 0;">
          <h3>Địa chỉ giao hàng:</h3>
          <p>${orderData.shippingAddress}</p>
        </div>

        <p>Chúng tôi sẽ xử lý đơn hàng và giao hàng trong thời gian sớm nhất.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: `Xác nhận đơn hàng #${orderData.orderNumber}`,
      html,
    });
  }

  async sendOrderStatusUpdateEmail(
    to: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      status: string;
      trackingNumber?: string;
    },
  ): Promise<void> {
    let statusMessage = '';
    let statusColor = '#007bff';

    switch (orderData.status.toLowerCase()) {
      case 'processing':
        statusMessage = 'Đơn hàng đang được xử lý';
        statusColor = '#ffc107';
        break;
      case 'shipped':
        statusMessage = 'Đơn hàng đã được gửi đi';
        statusColor = '#17a2b8';
        break;
      case 'delivered':
        statusMessage = 'Đơn hàng đã được giao thành công';
        statusColor = '#28a745';
        break;
      case 'cancelled':
        statusMessage = 'Đơn hàng đã bị hủy';
        statusColor = '#dc3545';
        break;
      default:
        statusMessage = `Trạng thái đơn hàng: ${orderData.status}`;
    }

    const trackingHtml = orderData.trackingNumber
      ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
        <h3>Mã vận đơn:</h3>
        <p style="font-size: 18px; font-weight: bold; color: #007bff;">${orderData.trackingNumber}</p>
      </div>
    `
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Cập nhật trạng thái đơn hàng #${orderData.orderNumber}</h2>
        <p>Xin chào <strong>${orderData.customerName}</strong>,</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; border-radius: 5px;">
          <h3 style="color: ${statusColor}; margin: 0;">${statusMessage}</h3>
        </div>

        ${trackingHtml}

        <p>Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi!</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject: `Cập nhật đơn hàng #${orderData.orderNumber}: ${statusMessage}`,
      html,
    });
  }
}
