import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('빵집')
@Controller('api/bakeries')
export class BakeriesController {
  @Get()
  @ApiOperation({ summary: '빵집 검색' })
  search(@Query() query: any) {
    return { bakeries: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '빵집 상세 조회' })
  findOne(@Param('id') id: string) {
    return {};
  }
}
