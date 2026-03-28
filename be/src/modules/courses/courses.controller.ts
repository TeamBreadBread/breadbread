import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CourseListResponseDto, CourseDetailDto, RecommendRequestDto } from './dto/courses.dto';

@ApiTags('코스')
@Controller('api/courses')
export class CoursesController {
  @Get()
  @ApiOperation({ summary: '코스 목록 조회' })
  @ApiResponse({ status: 200, type: CourseListResponseDto })
  findAll(@Query() query: any) {
    return { courses: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '코스 상세 조회' })
  @ApiResponse({ status: 200, type: CourseDetailDto })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post('recommend')
  @ApiOperation({ summary: 'AI 코스 추천' })
  @ApiResponse({ status: 200, type: CourseDetailDto })
  recommend(@Body() body: RecommendRequestDto) {
    return {};
  }
}
