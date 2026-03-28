import { Module } from '@nestjs/common';
import { BakeriesController } from './bakeries.controller';

@Module({ controllers: [BakeriesController] })
export class BakeriesModule {}
