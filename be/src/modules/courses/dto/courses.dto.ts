import { ApiProperty } from '@nestjs/swagger';
import { BakerySummaryDto } from '../../bakeries/dto/bakeries.dto';

export class CourseSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '은행동 빵지순례 코스' })
  name: string;

  @ApiProperty({ example: 'https://cdn.breadbread.kr/courses/yeonnam.jpg' })
  thumbnailUrl: string;

  @ApiProperty({ example: 4 })
  bakeryCount: number;

  @ApiProperty({ description: '예상 소요 시간 (분)', example: 120 })
  estimatedTime: number;
}

export class CourseDetailDto extends CourseSummaryDto {
  @ApiProperty({ example: '은행동 핫플 빵집 4곳을 도는 인기 코스입니다.' })
  description: string;

  @ApiProperty({ type: [BakerySummaryDto] })
  bakeries: BakerySummaryDto[];
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseSummaryDto] })
  courses: CourseSummaryDto[];

  @ApiProperty({ example: 15 })
  total: number;
}

export class RecommendLocationDto {
  @ApiProperty({ format: 'double', example: 36.3280 })
  lat: number;

  @ApiProperty({ format: 'double', example: 127.4272 })
  lng: number;
}

export class RecommendRequestDto {
  @ApiProperty({ type: [String], description: '사용자 선호도 (예: 달달한, 건강한, 비건)', required: false, example: ['달달한', '촉촉한'] })
  preferences?: string[];

  @ApiProperty({ description: '최대 이동 시간 (분)', required: false, example: 90 })
  maxTime?: number;

  @ApiProperty({ description: '방문할 빵집 수', required: false, example: 3 })
  bakeryCount?: number;

  @ApiProperty({ type: RecommendLocationDto, required: false })
  location?: RecommendLocationDto;

  @ApiProperty({ type: [String], description: '알러지 정보', required: false, example: ['견과류'] })
  allergies?: string[];
}
