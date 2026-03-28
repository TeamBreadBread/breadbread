import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseListResponseDto, CourseDetailDto, RecommendRequestDto } from './dto/courses.dto';

const COURSE_DETAIL_EXAMPLE = {
  id: 1,
  name: '은행동 빵지순례 코스',
  thumbnailUrl: 'https://cdn.breadbread.kr/courses/eunhaeng.jpg',
  bakeryCount: 4,
  estimatedTime: 120,
  description: '은행동의 숨은 빵집들을 탐방하는 코스입니다.',
  bakeries: [
    { id: 1, name: '르뺑 베이커리', address: '대전시 중구 은행동 123-4', lat: 36.3280, lng: 127.4272, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/lepain.jpg', rating: 4.8, reviewCount: 124 },
    { id: 3, name: '은행제빵소', address: '대전시 중구 은행동 78-2', lat: 36.3290, lng: 127.4260, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/eunhaeng.jpg', rating: 4.5, reviewCount: 67 },
  ],
};

@ApiTags('코스')
@Controller('api/courses')
export class CoursesController {
  @Get()
  @ApiOperation({ summary: '코스 목록 조회' })
  @ApiResponse({
    status: 200,
    type: CourseListResponseDto,
    example: {
      courses: [
        { id: 1, name: '은행동 빵지순례 코스', thumbnailUrl: 'https://cdn.breadbread.kr/courses/eunhaeng.jpg', bakeryCount: 4, estimatedTime: 120 },
        { id: 2, name: '둔산동 브런치 코스', thumbnailUrl: 'https://cdn.breadbread.kr/courses/dunsan.jpg', bakeryCount: 3, estimatedTime: 90 },
      ],
      total: 2,
    },
  })
  findAll(@Query() query: any) {
    return { courses: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '코스 상세 조회' })
  @ApiResponse({ status: 200, type: CourseDetailDto, example: COURSE_DETAIL_EXAMPLE })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post('recommend')
  @ApiOperation({ summary: 'AI 코스 추천' })
  @ApiResponse({ status: 200, type: CourseDetailDto, example: COURSE_DETAIL_EXAMPLE })
  recommend(@Body() body: RecommendRequestDto) {
    return {};
  }
}
