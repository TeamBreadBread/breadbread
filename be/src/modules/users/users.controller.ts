import { Controller, Post, Get, Patch, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('유저')
@Controller('api/users')
export class UsersController {
  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  signup(@Body() body: any) {
    return {};
  }

  @Get('check-id')
  @ApiOperation({ summary: 'ID 중복 확인' })
  checkId(@Query('loginId') loginId: string) {
    return { available: true };
  }

  @Get('find-id')
  @ApiOperation({ summary: 'ID 찾기' })
  findId(@Query('name') name: string, @Query('phone') phone?: string, @Query('email') email?: string) {
    return { loginId: '' };
  }

  @Post('reset-pw')
  @ApiOperation({ summary: 'PW 재설정 이메일 발송' })
  sendResetPw(@Body() body: { email: string }) {
    return {};
  }

  @Patch('reset-pw')
  @ApiOperation({ summary: 'PW 재설정' })
  resetPw(@Body() body: { token: string; newPassword: string }) {
    return {};
  }

  @Get('reset-pw/verify')
  @ApiOperation({ summary: 'PW 재설정 토큰 유효성 검사' })
  verifyResetPw(@Query('token') token: string) {
    return {};
  }

  @Get('me')
  @ApiOperation({ summary: '프로필 조회' })
  getProfile() {
    return {};
  }

  @Patch('me')
  @ApiOperation({ summary: '프로필 수정' })
  updateProfile(@Body() body: any) {
    return {};
  }
}
