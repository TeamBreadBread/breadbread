import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ example: 'user123' })
  loginId: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}

export class SocialLoginRequestDto {
  @ApiProperty({ example: 'oauth_access_token' })
  accessToken: string;
}

export class RefreshRequestDto {
  @ApiProperty()
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
  @ApiProperty({ description: '휴대폰 인증 완료 토큰' })
  verificationToken: string;
}
