import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class VerifyOtpDto extends RequestOtpDto {
  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SignupDto {
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(6, 72)
  password?: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}