import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.use('/swagger-ui/index.html', (_req: any, res: any) => res.redirect('/swagger-ui/'));

  const config = new DocumentBuilder()
    .setTitle('빵빵 (BreadBread) API')
    .setDescription('빵빵 택시 서비스 API 명세서')
    .setVersion('1.0.0')
    .addServer('https://bread-be-72253678429.asia-northeast3.run.app', 'Production Server (Cloud Run)')
    .addServer('http://localhost:8080', 'Local Development Server')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // example(단수) → examples(복수) 변환: Postman Mock Server는 examples 형식만 인식
  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem as Record<string, any>)) {
      for (const response of Object.values(operation?.responses ?? {})) {
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

  // openapi.yaml 자동 갱신 (CI/CD → Postman sync 트리거용)
  const openapiPath = path.join(__dirname, '..', 'static', 'openapi.yaml');
  fs.mkdirSync(path.dirname(openapiPath), { recursive: true });
  fs.writeFileSync(openapiPath, yaml.dump(document));

  SwaggerModule.setup('swagger-ui', app, document, {
    swaggerOptions: { url: '/openapi.yaml' },
  });

  app.use('/api-docs', (_req: any, res: any) => res.json(document));
  app.use('/openapi.yaml', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/yaml');
    res.send(yaml.dump(document));
  });

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
}

bootstrap();
