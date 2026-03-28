import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.use('/swagger-ui/index.html', (_req: any, res: any) => res.redirect('/swagger-ui/'));

  // Serve openapi.yaml as Swagger UI
  const openapiPath = path.join(__dirname, '..', 'static', 'openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const document = yaml.load(fs.readFileSync(openapiPath, 'utf8')) as Record<string, unknown>;
    SwaggerModule.setup('swagger-ui', app, document as any, {
      swaggerOptions: { url: '/openapi.yaml' },
    });
    app.use('/api-docs', (_req: any, res: any) => res.json(document));
    app.use('/openapi.yaml', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/yaml');
      res.send(fs.readFileSync(openapiPath, 'utf8'));
    });
  } else {
    console.warn(`openapi.yaml not found at ${openapiPath}`);
  }

  const port = process.env.PORT ?? 8080;
  await app.listen(port);
}

bootstrap();
