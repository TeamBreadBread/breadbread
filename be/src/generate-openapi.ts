import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('빵빵 (BreadBread) API')
    .setDescription('빵빵 택시 서비스 API 명세서')
    .setVersion('1.0.0')
    .addServer('https://bread-be-72253678429.asia-northeast3.run.app', 'Production Server (Cloud Run)')
    .addServer('http://localhost:8080', 'Local Development Server')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const openapiPath = path.join(__dirname, '..', 'static', 'openapi.yaml');
  fs.mkdirSync(path.dirname(openapiPath), { recursive: true });
  fs.writeFileSync(openapiPath, yaml.dump(document));

  console.log(`openapi.yaml generated: ${openapiPath}`);
  await app.close();
}

generate();
