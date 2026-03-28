import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('메인')
@Controller('api/main')
export class MainController {
  @Get()
  @ApiOperation({ summary: '메인 화면 출력' })
  getMain() {
    return { banners: [], recommendedCourses: [], popularBakeries: [] };
  }
}
