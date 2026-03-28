import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('예약')
@Controller('api/reservations')
export class ReservationsController {
  @Get()
  @ApiOperation({ summary: '예약 목록 조회' })
  findAll() {
    return { reservations: [] };
  }

  @Post()
  @ApiOperation({ summary: '예약 생성' })
  create(@Body() body: any) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '예약 상세 조회' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '예약 수정' })
  update(@Param('id') id: string, @Body() body: any) {
    return {};
  }

  @Delete(':id')
  @ApiOperation({ summary: '예약 취소' })
  remove(@Param('id') id: string) {
    return {};
  }
}
