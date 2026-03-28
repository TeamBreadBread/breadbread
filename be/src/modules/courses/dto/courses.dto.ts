import { ApiProperty } from '@nestjs/swagger';
import { BakerySummaryDto } from '../../bakeries/dto/bakeries.dto';

export class CourseSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  bakeryCount: number;

  @ApiProperty({ description: '예상 소요 시간 (분)' })
  estimatedTime: number;
}

export class CourseDetailDto extends CourseSummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty({ type: [BakerySummaryDto] })
  bakeries: BakerySummaryDto[];
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseSummaryDto] })
  courses: CourseSummaryDto[];

  @ApiProperty()
  total: number;
}

export class RecommendLocationDto {
  @ApiProperty({ format: 'double' })
  lat: number;

  @ApiProperty({ format: 'double' })
  lng: number;
}

export class RecommendRequestDto {
  @ApiProperty({ type: [String], description: '사용자 선호도 (예: 달달한, 건강한, 비건)', required: false })
  preferences?: string[];

  @ApiProperty({ description: '최대 이동 시간 (분)', required: false })
  maxTime?: number;

  @ApiProperty({ description: '방문할 빵집 수', required: false })
  bakeryCount?: number;

  @ApiProperty({ type: RecommendLocationDto, required: false })
  location?: RecommendLocationDto;

  @ApiProperty({ type: [String], description: '알러지 정보', required: false })
  allergies?: string[];
}
