import { ApiProperty } from '@nestjs/swagger';
import { BakerySummaryDto } from '../../bakeries/dto/bakeries.dto';
import { CourseSummaryDto } from '../../courses/dto/courses.dto';
import { BannerDto } from '../../../common/dto/banner.dto';

export class MainResponseDto {
  @ApiProperty({ type: [BannerDto] })
  banners: BannerDto[];

  @ApiProperty({ type: [CourseSummaryDto] })
  recommendedCourses: CourseSummaryDto[];

  @ApiProperty({ type: [BakerySummaryDto] })
  popularBakeries: BakerySummaryDto[];
}
