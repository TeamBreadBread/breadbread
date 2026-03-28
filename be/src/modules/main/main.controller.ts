import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { BakerySummaryDto } from '../bakeries/dto/bakeries.dto';
import { CourseSummaryDto } from '../courses/dto/courses.dto';
import { BannerDto } from '../../common/dto/banner.dto';

export class MainResponseDto {
  @ApiProperty({ type: [BannerDto] })
  banners: BannerDto[];

  @ApiProperty({ type: [CourseSummaryDto] })
  recommendedCourses: CourseSummaryDto[];

  @ApiProperty({ type: [BakerySummaryDto] })
  popularBakeries: BakerySummaryDto[];
}

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
