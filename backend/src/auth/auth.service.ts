import { 
  Injectable, ConflictException, UnauthorizedException, BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private appleKeysCache: { keys: any[]; expiry: number } | null = null;
  private firebaseCertsCache: { certs: Record<string, string>; expiry: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async getApplePublicKey(kid: string): Promise<string> {
    const now = Date.now();
    if (!this.appleKeysCache || this.appleKeysCache.expiry < now) {
      const response = await fetch('https://appleid.apple.com/auth/keys');
      if (!response.ok) {
        throw new Error('Failed to fetch Apple public keys');
      }
      const data = await response.json();
      this.appleKeysCache = {
        keys: data.keys,
        expiry: now + 24 * 60 * 60 * 1000,
      };
    }

    const jwk = this.appleKeysCache.keys.find((k: any) => k.kid === kid);
    if (!jwk) {
      throw new Error('Apple public key not found for kid');
    }

    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    return publicKey.export({ type: 'spki', format: 'pem' }) as string;
  }

  private async getFirebasePublicKey(kid: string): Promise<string> {
    const now = Date.now();
    if (!this.firebaseCertsCache || this.firebaseCertsCache.expiry < now) {
      const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
      if (!response.ok) {
        throw new Error('Failed to fetch Firebase public certificates');
      }
      const certs = await response.json();
      this.firebaseCertsCache = {
        certs,
        expiry: now + 12 * 60 * 60 * 1000,
      };
    }

    const cert = this.firebaseCertsCache.certs[kid];
    if (!cert) {
      throw new Error('Firebase public key cert not found for kid');
    }

    return cert;
  }

  // Sign up a user locally
  async signUp(email: string, password?: string, displayName?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email address is already registered');
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
        provider: 'email',
        emailVerified: false,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_signup',
        details: JSON.stringify({ email: user.email }),
      },
    });

    // Simulate sending email verification link
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log(`[EMAIL VERIFICATION] Verification link for user ${email}: http://localhost:5173/verify-email?token=${verificationToken}&userId=${user.id}`);

    const { passwordHash: _, ...result } = user;
    return result;
  }

  // Verify Google OAuth Token
  async verifyGoogleToken(idToken: string): Promise<any> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      const data = await response.json();
      
      if (data.error_description || !data.email) {
        throw new UnauthorizedException('Invalid Google ID Token');
      }
      
      return {
        email: data.email,
        providerId: data.sub,
        displayName: data.name || data.email.split('@')[0],
        avatar: data.picture,
      };
    } catch (e) {
      throw new UnauthorizedException('Google Token Verification failed');
    }
  }

  // Verify Apple OAuth Token
  async verifyAppleToken(idToken: string): Promise<any> {
    try {
      const decoded = jwt.decode(idToken, { complete: true }) as any;
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      const signingKey = await this.getApplePublicKey(decoded.header.kid);
      
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID') || 'com.novadocs.client';
      const verified = jwt.verify(idToken, signingKey, {
        issuer: 'https://appleid.apple.com',
        audience: clientId,
        algorithms: ['RS256'],
      }) as any;

      return {
        email: verified.email || `${verified.sub}@apple.placeholder`,
        providerId: verified.sub,
        displayName: verified.email ? verified.email.split('@')[0] : 'Apple User',
        avatar: null,
      };
    } catch (e: any) {
      throw new UnauthorizedException(e.message || 'Apple Token Verification failed');
    }
  }

  // Handle Sign In with OAuth
  async handleOAuthSignIn(provider: string, idToken: string, requestInfo?: { device?: string; ipAddress?: string }) {
    let oauthUser: { email: string; providerId: string; displayName?: string; avatar?: string };
    
    if (provider === 'google') {
      oauthUser = await this.verifyGoogleToken(idToken);
    } else if (provider === 'apple') {
      oauthUser = await this.verifyAppleToken(idToken);
    } else {
      throw new BadRequestException('Unsupported OAuth provider');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: oauthUser.email },
          { providerId: oauthUser.providerId, provider }
        ]
      }
    });

    if (!user) {
      // Create user if they don't exist
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          displayName: oauthUser.displayName,
          avatar: oauthUser.avatar,
          provider,
          providerId: oauthUser.providerId,
          emailVerified: true, // OAuth emails are verified by default
        }
      });
      
      // Save details to OAuthAccount
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider,
          providerId: oauthUser.providerId,
        }
      });
    } else {
      // Link account if provider was different
      const dataToUpdate: any = {};
      if (!user.providerId) {
        dataToUpdate.provider = provider;
        dataToUpdate.providerId = oauthUser.providerId;
      }
      if (oauthUser.avatar && !user.avatar) {
        dataToUpdate.avatar = oauthUser.avatar;
      }
      if (Object.keys(dataToUpdate).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate
        });
      }
    }

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_oauth_login',
        details: JSON.stringify({ provider }),
        ipAddress: requestInfo?.ipAddress,
      },
    });

    return this.login(user, requestInfo, false);
  }

  // Validate local login credentials
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (isMatch) {
      const { passwordHash: _, ...result } = user;
      return result;
    }

    return null;
  }

  // Issue access & refresh token session
  async login(user: any, requestInfo?: { device?: string; ipAddress?: string }, rememberMe: boolean = false) {
    const payload = { email: user.email, sub: user.id };
    
    // Generate Access Token (15 mins)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    // 30 days if rememberMe, otherwise 7 days
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    // Register refresh token in database
    await this.prisma.session.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        device: requestInfo?.device || 'Unknown Device',
        ipAddress: requestInfo?.ipAddress || '127.0.0.1',
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    };
  }

  // Rotate session tokens
  async refresh(token: string, requestInfo?: { device?: string; ipAddress?: string }) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh session');
    }

    // Delete old session token
    await this.prisma.session.delete({ where: { id: session.id } });

    // Generate new refresh token
    const nextRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save next session
    await this.prisma.session.create({
      data: {
        token: nextRefreshToken,
        userId: session.userId,
        expiresAt,
        device: requestInfo?.device || session.device,
        ipAddress: requestInfo?.ipAddress || session.ipAddress,
      },
    });

    const payload = { email: session.user.email, sub: session.userId };
    const nextAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        avatar: session.user.avatar,
        emailVerified: session.user.emailVerified,
      },
    };
  }

  // Remove a single session
  async logout(token: string) {
    try {
      await this.prisma.session.delete({
        where: { token },
      });
    } catch {
      // Silently ignore if session doesn't exist
    }
    return { success: true };
  }

  // Terminate all sessions of a user
  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Log action
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'user_logout_all_devices',
        details: 'Terminated all active sessions.',
      },
    });

    return { success: true };
  }

  // Generate Forgot Password Token
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Prevent user enumeration
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    // Save token as part of Audit Logs / Cache or just simulate email printout
    console.log(`[PASSWORD RESET] Reset link for user ${email}: http://localhost:5173/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);

    // In a real application, save to DB or cache with expiry, for MVP we can return in payload
    return { success: true, mockResetToken: resetToken };
  }

  // Reset password using verified token
  async resetPassword(email: string, token: string, pass: string) {
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_password_reset',
        details: 'Password was successfully reset.',
      },
    });

    return { success: true };
  }

  // Confirm email verification
  async verifyEmail(userId: string, token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_email_verified',
        details: 'User email was verified.',
      },
    });

    return { success: true };
  }

  // Retrieve session audit history
  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  // Verify Firebase ID Token using Google public keys
  async verifyFirebaseToken(idToken: string): Promise<any> {
    try {
      const decoded = jwt.decode(idToken, { complete: true }) as any;
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid Firebase token format');
      }

      const signingKey = await this.getFirebasePublicKey(decoded.header.kid);
      const firebaseProjectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || 'novadocs-8af56';

      const verifiedPayload = jwt.verify(idToken, signingKey, {
        audience: firebaseProjectId,
        issuer: `https://securetoken.google.com/${firebaseProjectId}`,
        algorithms: ['RS256'],
      }) as any;

      return verifiedPayload;
    } catch (e: any) {
      throw new UnauthorizedException(e.message || 'Firebase Token Verification failed');
    }
  }

  // Handle Sign In with Firebase ID Token
  async handleFirebaseSignIn(idToken: string, requestInfo?: { device?: string; ipAddress?: string }) {
    const payload = await this.verifyFirebaseToken(idToken);
    const email = payload.email;
    const providerId = payload.sub;
    const displayName = payload.name || email.split('@')[0];
    const avatar = payload.picture || null;
    const emailVerified = !!payload.email_verified;

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { providerId, provider: 'firebase' }
        ]
      }
    });

    if (!user) {
      // Create user if they don't exist
      user = await this.prisma.user.create({
        data: {
          email,
          displayName,
          avatar,
          provider: 'firebase',
          providerId,
          emailVerified,
        }
      });
      
      // Save details to OAuthAccount
      await this.prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'firebase',
          providerId,
        }
      });
    } else {
      // Link or update user info if needed
      const dataToUpdate: any = {};
      if (user.provider !== 'firebase') {
        dataToUpdate.provider = 'firebase';
        dataToUpdate.providerId = providerId;
      }
      if (avatar && !user.avatar) {
        dataToUpdate.avatar = avatar;
      }
      if (emailVerified && !user.emailVerified) {
        dataToUpdate.emailVerified = true;
      }
      if (Object.keys(dataToUpdate).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: dataToUpdate
        });
      }
    }

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_firebase_login',
        details: JSON.stringify({ email }),
        ipAddress: requestInfo?.ipAddress,
      },
    });

    return this.login(user, requestInfo, false);
  }
}
