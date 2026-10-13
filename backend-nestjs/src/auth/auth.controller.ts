import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { S3Service } from '../s3/s3.service';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
  OAuthDto,
  GithubAuthDto,
  LinkedinAuthDto,
  AdminLoginDto,
  AdminVerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  StudentLoginDto,
  ForceChangePasswordDto,
  RefreshTokenDto,
  LogoutDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('register/send-otp')
  @ApiOperation({ summary: 'Send OTP for registration' })
  @HttpCode(HttpStatus.OK)
  async sendRegistrationOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendRegistrationOtp(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register with OTP' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.login(dto, ip);
  }

  @Post('student-login')
  @ApiOperation({ summary: 'Student login with University UID and password' })
  @HttpCode(HttpStatus.OK)
  async studentLogin(@Body() dto: StudentLoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.studentLogin(dto, ip);
  }

  @Post('force-change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mandatory password change for first-time or reset logins',
  })
  @HttpCode(HttpStatus.OK)
  async forceChangePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ForceChangePasswordDto,
  ) {
    return this.authService.forceChangePassword(userId, dto);
  }

  @Post('admin-login')
  @ApiOperation({ summary: 'Admin login requesting OTP' })
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: AdminLoginDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.adminLogin(dto, ip);
  }

  @Post('admin-login/verify')
  @ApiOperation({ summary: 'Verify admin OTP and login' })
  @HttpCode(HttpStatus.OK)
  async adminVerifyOtp(@Body() dto: AdminVerifyOtpDto) {
    return this.authService.adminVerifyOtp(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate and exchange a refresh token for new credentials' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke active refresh token or user session' })
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string, @Body() dto: LogoutDto) {
    return this.authService.logout(userId, dto);
  }

  @Post('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() dto: OAuthDto) {
    return this.authService.googleLogin(dto);
  }

  @Post('github')
  @ApiOperation({ summary: 'GitHub OAuth login' })
  @HttpCode(HttpStatus.OK)
  async githubLogin(@Body() dto: GithubAuthDto) {
    return this.authService.githubLogin(dto);
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'LinkedIn OAuth login' })
  @HttpCode(HttpStatus.OK)
  async linkedinLogin(@Body() dto: LinkedinAuthDto) {
    return this.authService.linkedinLogin(dto);
  }

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP for passwordless login' })
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and login' })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.authService.getMe(userId);
    return { user };
  }

  @Put('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() body: any) {
    const user = await this.authService.updateProfile(userId, body);
    return { user };
  }

  @Post('avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Get the current user to find the old avatar URL
    const currentUser = await this.authService.getMe(userId);

    // Upload the memory buffer directly to S3
    const avatarUrl = await this.s3Service.uploadFile(file, 'avatars');

    // Delete the old avatar from S3 if it exists (run in background)
    if (
      currentUser &&
      currentUser.avatar &&
      currentUser.avatar.includes('amazonaws.com')
    ) {
      this.s3Service.deleteFile(currentUser.avatar).catch(() => {});
    }

    const user = await this.authService.updateAvatar(userId, avatarUrl);
    return { user, avatarUrl };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send password reset OTP' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
