import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateLocationDto } from './dto/location.dto';

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
