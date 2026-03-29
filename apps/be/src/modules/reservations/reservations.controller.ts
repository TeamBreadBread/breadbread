import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateReservationRequestDto,
  UpdateReservationRequestDto,
  ReservationListResponseDto,
  ReservationDetailDto,
} from './dto/reservations.dto';

const RESERVATION_EXAMPLE = {
  id: 1,
  status: 'CONFIRMED',
  reservationDate: '2026-04-01T14:00:00.000Z',
  courseId: 1,
  courseName: '은행동 빵지순례 코스',
  driverName: '김기사',
  driverPhone: '01098765432',
  passengerCount: 2,
  createdAt: '2026-03-28T10:00:00.000Z',
};

@ApiTags('예약')
@Controller('api/reservations')
export class ReservationsController {
  @Get()
  @ApiOperation({ summary: '예약 목록 조회' })
  @ApiResponse({ status: 200, type: ReservationListResponseDto, example: { reservations: [RESERVATION_EXAMPLE] } })
  findAll() {
    return { reservations: [] };
  }

  @Post()
  @ApiOperation({ summary: '예약 생성' })
  @ApiResponse({ status: 201, type: ReservationDetailDto, example: RESERVATION_EXAMPLE })
  create(@Body() body: CreateReservationRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '예약 상세 조회' })
  @ApiResponse({ status: 200, type: ReservationDetailDto, example: RESERVATION_EXAMPLE })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '예약 수정' })
  @ApiResponse({ status: 200, type: ReservationDetailDto, example: { ...RESERVATION_EXAMPLE, status: 'PENDING' } })
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
