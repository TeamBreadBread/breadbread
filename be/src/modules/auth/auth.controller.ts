import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('인증')
@Controller('api/auth')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  login(@Body() body: { loginId: string; password: string }) {
    return { accessToken: '', refreshToken: '' };
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  logout() {
    return {};
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  refresh(@Body() body: { refreshToken: string }) {
    return { accessToken: '', refreshToken: '' };
  }

  @Post(':provider')
  @ApiOperation({ summary: '소셜 로그인' })
  socialLogin(@Param('provider') provider: string, @Body() body: { accessToken: string }) {
    return { accessToken: '', refreshToken: '' };
  }

  @Post('phone/send')
  @ApiOperation({ summary: '휴대전화 인증 요청' })
  sendPhone(@Body() body: { phone: string }) {
    return {};
  }

  @Post('phone/verify')
  @ApiOperation({ summary: '휴대전화 인증 확인' })
  verifyPhone(@Body() body: { phone: string; code: string }) {
    return { verificationToken: '' };
  }
}
