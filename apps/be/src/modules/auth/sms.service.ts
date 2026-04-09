import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ISmsProvider, SMS_PROVIDER } from "./interfaces/sms-provider.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthType, PhoneVerification } from "./entities/phone-verification.entity";
import { Repository } from "typeorm";
import * as crypto from "crypto";

const VERIFICATION_CODE_TTL_MS = 3 * 60 * 1000;

@Injectable()
export class SmsService {
  constructor(
    @Inject(SMS_PROVIDER)
    private readonly smsProvider: ISmsProvider,
    @InjectRepository(PhoneVerification)
    private readonly phoneVerificationRepo: Repository<PhoneVerification>,
  ) {}

  async sendVerificationCode(phone: string): Promise<void> {
    await this.phoneVerificationRepo.delete({ phone, isVerified: false });
    const code = crypto.randomInt(100000, 999999).toString();
    const expiredAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

    const saved = await this.phoneVerificationRepo.save({
      phone,
      code,
      expiredAt,
      isVerified: false,
      authType: AuthType.SMS,
    });

    try {
      await this.smsProvider.sendSms(phone, `[빵빵] 인증번호: ${code}`);
    } catch {
      await this.phoneVerificationRepo.delete(saved.id);
      throw new InternalServerErrorException("SMS 발송에 실패했습니다. 다시 시도해주세요.");
    }
  }

  async verifyCode(phone: string, code: string): Promise<void> {
    const record = await this.phoneVerificationRepo.findOne({
      where: { phone, isVerified: false },
      order: { id: "DESC" },
    });

    if (!record || record.expiredAt < new Date() || record.code !== code) {
      throw new UnauthorizedException("인증번호가 올바르지 않거나 만료되었습니다.");
    }
    await this.phoneVerificationRepo.update(record.id, { isVerified: true });
  }
}
