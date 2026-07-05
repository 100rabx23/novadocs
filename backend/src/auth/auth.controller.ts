import { 
  Controller, Post, Body, Get, UseGuards, Req, Ip, Headers, UnauthorizedException, BadRequestException, HttpCode, HttpStatus 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body('email') email: string,
    @Body('password') password?: string,
    @Body('displayName') displayName?: string,
  ) {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }
    return this.authService.signUp(email, password, displayName);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password?: string,
    @Body('rememberMe') rememberMe?: boolean,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    const requestInfo = { device: userAgent, ipAddress: ip };
    return this.authService.login(user, requestInfo, !!rememberMe);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleSignIn(
    @Body('token') token: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!token) {
      throw new BadRequestException('Google ID Token is required');
    }
    return this.authService.handleOAuthSignIn('google', token, { device: userAgent, ipAddress: ip });
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleSignIn(
    @Body('token') token: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!token) {
      throw new BadRequestException('Apple ID Token is required');
    }
    return this.authService.handleOAuthSignIn('apple', token, { device: userAgent, ipAddress: ip });
  }

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  async firebaseSignIn(
    @Body('token') token: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!token) {
      throw new BadRequestException('Firebase ID Token is required');
    }
    return this.authService.handleFirebaseSignIn(token, { device: userAgent, ipAddress: ip });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Ip() ip?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refresh(refreshToken, { device: userAgent, ipAddress: ip });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.logout(refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('email') email: string,
    @Body('token') token: string,
    @Body('password') password?: string,
  ) {
    if (!email || !token || !password) {
      throw new BadRequestException('Email, token, and password are required');
    }
    return this.authService.resetPassword(email, token, password);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body('userId') userId: string,
    @Body('token') token: string,
  ) {
    if (!userId || !token) {
      throw new BadRequestException('userId and token are required');
    }
    return this.authService.verifyEmail(userId, token);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: any) {
    return this.authService.getSessions(req.user.id);
  }
}
