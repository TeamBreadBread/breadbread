import { Controller, Post, Body, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { TokenResponseDto } from "../../common/dto/token-response.dto";
import {
  LoginRequestDto,
  SocialLoginRequestDto,
  RefreshRequestDto,
  SendPhoneRequestDto,
  VerifyPhoneRequestDto,
  VerifyPhoneResponseDto,
} from "./dto/auth.dto";
import { SignupRequestDto } from "../users/dto/users.dto";
import { AuthService } from "./auth.service";
import { Throttle } from "@nestjs/throttler";

const TOKEN_EXAMPLE = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzAwMDAwMDAwfQ.abc123",
  refreshToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzAwMDAwMDAwfQ.refresh123",
  tokenType: "Bearer",
};

@ApiTags("인증")
@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "회원가입" })
  @ApiResponse({ status: 201 })
  signup(@Body() body: SignupRequestDto) {
    return this.authService.signup(body);
  }

  @Post("login")
  @ApiOperation({ summary: "로그인" })
  @ApiResponse({ status: 200, type: TokenResponseDto, example: TOKEN_EXAMPLE })
  login(@Body() body: LoginRequestDto) {
    return this.authService.login(body);
  }

  @Post("logout")
  @ApiOperation({ summary: "로그아웃" })
  @ApiResponse({ status: 200 })
  logout(@Body() body: RefreshRequestDto) {
    return this.authService.logout(body);
  }

  @Post("refresh")
  @ApiOperation({ summary: "토큰 갱신" })
  @ApiResponse({ status: 200, type: TokenResponseDto, example: TOKEN_EXAMPLE })
  refresh(@Body() body: RefreshRequestDto) {
    return this.authService.refresh(body);
  }

  @Post(":provider")
  @ApiOperation({ summary: "소셜 로그인" })
  @ApiResponse({ status: 200, type: TokenResponseDto, example: TOKEN_EXAMPLE })
  socialLogin(@Param("provider") provider: string, @Body() body: SocialLoginRequestDto) {
    return { accessToken: "", refreshToken: "" };
  }

  @Post("phone/send")
  @ApiOperation({ summary: "휴대전화 인증 요청" })
  @ApiResponse({ status: 200 })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendPhone(@Body() body: SendPhoneRequestDto) {
    await this.authService.sendPhone(body.phone);
  }

  @Post("phone/verify")
  @ApiOperation({ summary: "휴대전화 인증 확인" })
  @ApiResponse({
    status: 200,
    type: VerifyPhoneResponseDto,
    example: { verificationToken: "verify_token_abc123" },
  })
  async verifyPhone(@Body() body: VerifyPhoneRequestDto) {
    const verificationToken = await this.authService.verifyPhone(body.phone, body.code);
    return { verificationToken };
  }
}
