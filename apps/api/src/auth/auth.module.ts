import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpTokenService } from './otp-token.service';
import { SmsOtpProvider } from './otp.provider';

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [AuthController],
  providers: [AuthService, OtpTokenService, SmsOtpProvider],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}