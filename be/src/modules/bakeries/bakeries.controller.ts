import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BakeryListResponseDto, BakeryDetailDto } from './dto/bakeries.dto';

@ApiTags('빵집')
@Controller('api/bakeries')
export class BakeriesController {
  @Get()
  @ApiOperation({ summary: '빵집 검색' })
  @ApiResponse({ status: 200, type: BakeryListResponseDto })
  search(@Query() query: any) {
    return { bakeries: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '빵집 상세 조회' })
  @ApiResponse({ status: 200, type: BakeryDetailDto })
  findOne(@Param('id') id: string) {
    return {};
  }
}
