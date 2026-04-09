import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CheckIdResponseDto, SignupRequestDto } from "./dto/users.dto";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import jwtConfig from "src/config/jwt.config";
import { ConfigType } from "@nestjs/config";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async signup(dto: SignupRequestDto): Promise<{ message: string }> {
    const existing = await this.userRepository.findOne({
      where: { loginId: dto.loginId },
    });
    if (existing) {
      throw new ConflictException("이미 사용 중인 아이디입니다.");
    }
    const payload = this.jwtService.verify(dto.verificationToken, {
      secret: this.jwtConfiguration.accessSecret,
    });
    if (!payload.verified || payload.phone !== dto.phone) {
      throw new UnauthorizedException("전화번호 인증이 필요합니다.");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    await this.userRepository.save(user);

    return { message: "회원가입이 완료되었습니다." };
  }

  async checkId(loginId: string): Promise<CheckIdResponseDto> {
    const exists = await this.userRepository.exists({ where: { loginId } });
    return { available: !exists };
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByLoginIdIncludingPassword(loginId: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.loginId = :loginId", { loginId })
      .getOne();
  }
}
