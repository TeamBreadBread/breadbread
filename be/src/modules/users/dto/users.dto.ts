import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  BUSINESS = 'BUSINESS',
  DRIVER = 'DRIVER',
}

export class SignupRequestDto {
  @ApiProperty({ example: 'user123' })
  loginId: string;

  @ApiProperty({ format: 'password' })
  password: string;

  @ApiProperty({ example: '홍길동' })
  name: string;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: '01012345678' })
  phone: string;

  @ApiProperty({ description: '휴대폰 인증 완료 토큰' })
  verificationToken: string;

  @ApiProperty({ enum: UserRole, description: '가입 역할 (일반 사용자/사업자/기사)' })
  role: UserRole;
}

export class UserProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  loginId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class UpdateProfileRequestDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false, format: 'email' })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;
}

export class CheckIdResponseDto {
  @ApiProperty()
  available: boolean;
}

export class FindIdResponseDto {
  @ApiProperty()
  loginId: string;
}

export class ResetPwRequestDto {
  @ApiProperty({ format: 'email' })
  email: string;
}

export class ConfirmResetPwRequestDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  newPassword: string;
}
