import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateReservationRequestDto,
  UpdateReservationRequestDto,
  ReservationListResponseDto,
  ReservationDetailDto,
} from './dto/reservations.dto';

@ApiTags('예약')
@Controller('api/reservations')
export class ReservationsController {
  @Get()
  @ApiOperation({ summary: '예약 목록 조회' })
  @ApiResponse({ status: 200, type: ReservationListResponseDto })
  findAll() {
    return { reservations: [] };
  }

  @Post()
  @ApiOperation({ summary: '예약 생성' })
  @ApiResponse({ status: 201, type: ReservationDetailDto })
  create(@Body() body: CreateReservationRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '예약 상세 조회' })
  @ApiResponse({ status: 200, type: ReservationDetailDto })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '예약 수정' })
  @ApiResponse({ status: 200, type: ReservationDetailDto })
  update(@Param('id') id: string, @Body() body: UpdateReservationRequestDto) {
    return {};
  }

  @Delete(':id')
  @ApiOperation({ summary: '예약 취소' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return {};
  }
}
