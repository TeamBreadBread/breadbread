import { Controller, Post, Get, Patch, Query, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import {
  UserProfileDto,
  UpdateProfileRequestDto,
  CheckIdResponseDto,
  FindIdResponseDto,
  ResetPwRequestDto,
  ConfirmResetPwRequestDto,
} from "./dto/users.dto";
import { UsersService } from "./users.service";

@ApiTags("유저")
@Controller("api/users")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get("check-id")
  @ApiOperation({ summary: "ID 중복 확인" })
  @ApiResponse({ status: 200, type: CheckIdResponseDto, example: { available: true } })
  checkId(@Query("loginId") loginId: string) {
    return this.userService.checkId(loginId);
  }

  @Get("find-id")
  @ApiOperation({ summary: "ID 찾기" })
  @ApiResponse({ status: 200, type: FindIdResponseDto, example: { loginId: "user123" } })
  findId(
    @Query("name") name: string,
    @Query("phone") phone?: string,
    @Query("email") email?: string,
  ) {
    return { loginId: "" };
  }

  @Post("reset-pw")
  @ApiOperation({ summary: "PW 재설정 이메일 발송" })
  @ApiResponse({ status: 200 })
  sendResetPw(@Body() body: ResetPwRequestDto) {
    return {};
  }

  @Patch("reset-pw")
  @ApiOperation({ summary: "PW 재설정" })
  @ApiResponse({ status: 200 })
  resetPw(@Body() body: ConfirmResetPwRequestDto) {
    return {};
  }

  @Get("reset-pw/verify")
  @ApiOperation({ summary: "PW 재설정 토큰 유효성 검사" })
  @ApiResponse({ status: 200 })
  verifyResetPw(@Query("token") token: string) {
    return {};
  }

  @Get("me")
  @ApiOperation({ summary: "프로필 조회" })
  @ApiResponse({
    status: 200,
    type: UserProfileDto,
    example: {
      id: 1,
      loginId: "user123",
      name: "홍길동",
      email: "user@example.com",
      phone: "01012345678",
      role: "USER",
      createdAt: "2026-01-15T09:00:00.000Z",
    },
  })
  getProfile() {
    return {};
  }

  @Patch("me")
  @ApiOperation({ summary: "프로필 수정" })
  @ApiResponse({
    status: 200,
    type: UserProfileDto,
    example: {
      id: 1,
      loginId: "user123",
      name: "홍길동",
      email: "user@example.com",
      phone: "01012345678",
      role: "USER",
      createdAt: "2026-01-15T09:00:00.000Z",
    },
  })
  updateProfile(@Body() body: UpdateProfileRequestDto) {
    return {};
  }
}
