import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'user123' })
  loginId: string;

  @ApiProperty({ example: 'password123!' })
  password: string;
}

export class SocialLoginRequestDto {
  @ApiProperty({ example: 'ya29.a0AfH6SMBx...' })
  accessToken: string;
}

export class RefreshRequestDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh123' })
  refreshToken: string;
}

export class SendPhoneRequestDto {
  @ApiProperty({ example: '01012345678' })
  phone: string;
}

export class VerifyPhoneRequestDto {
  @ApiProperty({ example: '01012345678' })
  phone: string;

  @ApiProperty({ example: '123456' })
  code: string;
}

export class VerifyPhoneResponseDto {
  @ApiProperty({ description: '휴대폰 인증 완료 토큰', example: 'verify_token_abc123' })
  verificationToken: string;
}
