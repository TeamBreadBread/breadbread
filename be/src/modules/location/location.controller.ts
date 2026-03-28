import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class UpdateLocationDto {
  latitude: number;
  longitude: number;
}

@ApiTags('위치')
@Controller('api/location')
export class LocationController {
  @Post()
  @ApiOperation({ summary: '위치 업데이트' })
  @ApiResponse({ status: 200 })
  update(@Body() body: UpdateLocationDto) {
    return {};
  }
}
