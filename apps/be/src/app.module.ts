import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { MainModule } from "./modules/main/main.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { BakeriesModule } from "./modules/bakeries/bakeries.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CommunityModule } from "./modules/community/community.module";
import { LocationModule } from "./modules/location/location.module";
import { AiModule } from "./modules/ai/ai.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import jwtConfig from "src/config/jwt.config";
import { validationSchema } from "./config/validation.schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [jwtConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    MainModule,
    AuthModule,
    UsersModule,
    BakeriesModule,
    CoursesModule,
    ReservationsModule,
    PaymentsModule,
    CommunityModule,
    LocationModule,
    AiModule,
    NotificationsModule,
  ],
})
export class AppModule {}
