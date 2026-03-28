import { Controller, Post, Get, Patch, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SignupRequestDto,
  UserProfileDto,
  UpdateProfileRequestDto,
  CheckIdResponseDto,
  FindIdResponseDto,
  ResetPwRequestDto,
  ConfirmResetPwRequestDto,
} from './dto/users.dto';

@ApiTags('유저')
@Controller('api/users')
export class UsersController {
  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201 })
  signup(@Body() body: SignupRequestDto) {
    return {};
  }

  @Get('check-id')
  @ApiOperation({ summary: 'ID 중복 확인' })
  @ApiResponse({ status: 200, type: CheckIdResponseDto })
  checkId(@Query('loginId') loginId: string) {
    return { available: true };
  }

  @Get('find-id')
  @ApiOperation({ summary: 'ID 찾기' })
  @ApiResponse({ status: 200, type: FindIdResponseDto })
  findId(@Query('name') name: string, @Query('phone') phone?: string, @Query('email') email?: string) {
    return { loginId: '' };
  }

  @Post('reset-pw')
  @ApiOperation({ summary: 'PW 재설정 이메일 발송' })
  @ApiResponse({ status: 200 })
  sendResetPw(@Body() body: ResetPwRequestDto) {
    return {};
  }

  @Patch('reset-pw')
  @ApiOperation({ summary: 'PW 재설정' })
  @ApiResponse({ status: 200 })
  resetPw(@Body() body: ConfirmResetPwRequestDto) {
    return {};
  }

  @Get('reset-pw/verify')
  @ApiOperation({ summary: 'PW 재설정 토큰 유효성 검사' })
  @ApiResponse({ status: 200 })
  verifyResetPw(@Query('token') token: string) {
    return {};
  }

  @Get('me')
  @ApiOperation({ summary: '프로필 조회' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getProfile() {
    return {};
  }

  @Patch('me')
  @ApiOperation({ summary: '프로필 수정' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  updateProfile(@Body() body: UpdateProfileRequestDto) {
    return {};
  }
}
