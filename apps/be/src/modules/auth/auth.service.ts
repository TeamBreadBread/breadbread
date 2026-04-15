import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import jwtConfig from "src/config/jwt.config";
import { ConfigType } from "@nestjs/config";
import { JwtPayload } from "./jwt.strategy";
import { LoginRequestDto, RefreshRequestDto } from "./dto/auth.dto";
import { TokenResponseDto } from "src/common/dto/token-response.dto";
import { SignupRequestDto } from "../users/dto/users.dto";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { SmsService } from "./sms.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { LessThan, Repository } from "typeorm";
import * as ms from "ms";

const PHONE_VERIFICATION_TOKEN_TTL = "10m";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  private generateToken(payload: JwtPayload, type: "access" | "refresh"): string {
    const secret =
      type === "access" ? this.jwtConfiguration.accessSecret : this.jwtConfiguration.refreshSecret;
    const expiresIn =
      type === "access"
        ? this.jwtConfiguration.accessExpiresIn
        : this.jwtConfiguration.refreshExpiresIn;
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  async signup(dto: SignupRequestDto): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(dto.verificationToken, {
        secret: this.jwtConfiguration.accessSecret,
      });
      if (!payload.verified || payload.phone !== dto.phone) {
        throw new UnauthorizedException("전화번호 인증이 필요합니다.");
      }
    } catch {
      throw new UnauthorizedException("유효하지 않거나 만료된 인증 토큰입니다.");
    }
    return this.userService.createUser(dto);
  }

  async login(dto: LoginRequestDto): Promise<TokenResponseDto> {
    const user = await this.userService.findByLoginIdIncludingPassword(dto.loginId);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    await this.refreshTokenRepository.delete({
      user: { id: user.id },
      expiredAt: LessThan(new Date()),
    });

    const payload: JwtPayload = { sub: user.id, loginId: user.loginId, role: user.role };
    const accessToken = this.generateToken(payload, "access");
    const refreshToken = this.generateToken(payload, "refresh");
    const hashedRefreshToken = this.hashToken(refreshToken);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: hashedRefreshToken,
      user: user,
      expiredAt: new Date(Date.now() + ms(this.jwtConfiguration.refreshExpiresIn)),
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken: refreshToken, tokenType: "Bearer" };
  }

  async refresh(dto: RefreshRequestDto): Promise<TokenResponseDto> {
    try {
      this.jwtService.verify(dto.refreshToken, {
        secret: this.jwtConfiguration.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }
    const refreshToken = await this.validateRefreshToken(dto.refreshToken);
    await this.refreshTokenRepository.update({ id: refreshToken.id }, { isRevoked: true });

    const user = refreshToken.user;
    const newPayload = { sub: user.id, loginId: user.loginId, role: user.role };
    const newAccessToken = this.generateToken(newPayload, "access");
    const newRefreshToken = this.generateToken(newPayload, "refresh");
    const newHashedRefreshToken = this.hashToken(newRefreshToken);

    const newRefreshTokenEntity = this.refreshTokenRepository.create({
      token: newHashedRefreshToken,
      user: user,
      expiredAt: new Date(Date.now() + ms(this.jwtConfiguration.refreshExpiresIn)),
      isRevoked: false,
    });
    await this.refreshTokenRepository.save(newRefreshTokenEntity);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, tokenType: "Bearer" };
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private async validateRefreshToken(token: string) {
    const hashedToken = this.hashToken(token);
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ["user"],
    });

    if (!refreshToken) {
      throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }
    if (refreshToken.isRevoked) {
      throw new UnauthorizedException("이미 사용된 토큰입니다.");
    }
    if (refreshToken.expiredAt < new Date()) {
      throw new UnauthorizedException("만료된 토큰입니다.");
    }
    return refreshToken;
  }

  async logout(dto: RefreshRequestDto): Promise<void> {
    const hashedRefreshToken = this.hashToken(dto.refreshToken);
    await this.refreshTokenRepository.update({ token: hashedRefreshToken }, { isRevoked: true });
  }

  async sendPhone(phone: string): Promise<void> {
    await this.smsService.sendVerificationCode(phone);
  }

  async verifyPhone(phone: string, code: string): Promise<string> {
    await this.smsService.verifyCode(phone, code);
    return this.jwtService.sign(
      { phone, verified: true } satisfies { phone: string; verified: boolean },
      { secret: this.jwtConfiguration.accessSecret, expiresIn: PHONE_VERIFICATION_TOKEN_TTL },
    );
  }
}
