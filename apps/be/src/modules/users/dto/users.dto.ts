import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
  DRIVER = 'DRIVER',
}

export class SignupRequestDto {
  @ApiProperty({ example: 'user123' })
  loginId: string;

  @ApiProperty({ format: 'password', example: 'password123!' })
  password: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: '01012345678' })
  phone: string;

  @ApiProperty({ description: '휴대폰 인증 완료 토큰', example: 'verify_token_abc123' })
  verificationToken: string;

  @ApiProperty({ enum: UserRole, description: '가입 역할 (일반 사용자/사업자/기사)', example: UserRole.USER })
  role: UserRole;
}

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user123' })
  loginId: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '01012345678' })
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty({ format: 'date-time', example: '2026-01-15T09:00:00.000Z' })
  createdAt: string;
}

export class UpdateProfileRequestDto {
  @ApiProperty({ required: false, example: '김철수' })
  name?: string;

  @ApiProperty({ required: false, format: 'email', example: 'new@example.com' })
  email?: string;

  @ApiProperty({ required: false, example: '01098765432' })
  phone?: string;
}

export class CheckIdResponseDto {
  @ApiProperty({ example: true })
  available: boolean;
}

export class FindIdResponseDto {
  @ApiProperty({ example: 'user123' })
  loginId: string;
}

export class ResetPwRequestDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  email: string;
}

export class ConfirmResetPwRequestDto {
  @ApiProperty({ example: 'reset_token_xyz789' })
  token: string;

  @ApiProperty({ example: 'newPassword123!' })
  newPassword: string;
}
