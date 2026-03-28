import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MainModule } from './modules/main/main.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BakeriesModule } from './modules/bakeries/bakeries.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommunityModule } from './modules/community/community.module';
import { LocationModule } from './modules/location/location.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
