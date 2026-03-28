import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('코스')
@Controller('api/courses')
export class CoursesController {
  @Get()
  @ApiOperation({ summary: '코스 목록 조회' })
  findAll(@Query() query: any) {
    return { courses: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '코스 상세 조회' })
  findOne(@Param('id') id: string) {
    return {};
  }
}
