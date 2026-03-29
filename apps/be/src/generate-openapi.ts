import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// DatabaseModule 제외 — DB 연결 없이 OpenAPI 생성
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
class SwaggerAppModule {}

async function generate() {
  const app = await NestFactory.create(SwaggerAppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('빵빵 (BreadBread) API')
    .setDescription('빵빵 택시 서비스 API 명세서')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // example(단수) → examples(복수) 변환: Postman Mock Server는 examples 형식만 인식
  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem as Record<string, unknown>)) {
      for (const response of Object.values((operation as any)?.responses ?? {})) {
        for (const mediaType of Object.values((response as any)?.content ?? {})) {
          const mt = mediaType as any;
          if (mt.example !== undefined) {
            mt.examples = { default: { value: mt.example } };
            delete mt.example;
          }
        }
      }
    }
  }

  const openapiPath = path.join(__dirname, '..', 'static', 'openapi.yaml');
  fs.mkdirSync(path.dirname(openapiPath), { recursive: true });
  fs.writeFileSync(openapiPath, yaml.dump(document));

  console.log(`openapi.yaml generated: ${openapiPath}`);
  await app.close();
}

generate();
