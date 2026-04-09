import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigType } from "@nestjs/config";
import jwtConfig from "src/config/jwt.config";
import { UsersModule } from "../users/users.module";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhoneVerification } from "./entities/phone-verification.entity";
import { SmsService } from "./sms.service";
import { SMS_PROVIDER } from "./interfaces/sms-provider.interface";
import { CoolsmsProvider } from "./providers/coolsms.provider";
import { RefreshToken } from "./entities/refresh-token.entity";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, PhoneVerification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn,
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    SmsService,
    { provide: SMS_PROVIDER, useClass: CoolsmsProvider },
  ],
})
export class AuthModule {}
