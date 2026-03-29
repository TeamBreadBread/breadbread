import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionName = config.get<string>('CLOUD_SQL_CONNECTION_NAME');

        // Cloud Run: Unix socket via Cloud SQL Auth Proxy
        // Local: TCP connection via docker-compose
        const isCloudRun = !!connectionName;

        return {
          type: 'postgres',
          ...(isCloudRun
            ? {
                host: `/cloudsql/${connectionName}`,
              }
            : {
                host: config.get<string>('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 5432),
              }),
          database: config.get<string>('DB_NAME', 'breaddb'),
          username: config.get<string>('DB_USERNAME', 'bread'),
          password: config.get<string>('DB_PASSWORD', 'bread1234'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: config.get<string>('NODE_ENV') !== 'production',
          logging: config.get<string>('NODE_ENV') !== 'production',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
