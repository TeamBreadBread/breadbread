import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('위치')
@Controller('api/location')
export class LocationController {
  @Post()
  @ApiOperation({ summary: '위치 업데이트' })
  update(@Body() body: { latitude: number; longitude: number }) {
    return {};
  }
}
