import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MainResponseDto } from './dto/main.dto';

@ApiTags('메인')
@Controller('api/main')
export class MainController {
  @Get()
  @ApiOperation({ summary: '메인 화면 출력' })
  @ApiResponse({ status: 200, type: MainResponseDto })
  getMain() {
    return { banners: [], recommendedCourses: [], popularBakeries: [] };
  }
}
