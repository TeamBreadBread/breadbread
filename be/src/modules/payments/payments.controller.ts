import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentRequestDto, PaymentDetailDto } from './dto/payments.dto';

const PAYMENT_EXAMPLE = {
  id: 1,
  reservationId: 1,
  amount: 45000,
  method: 'CARD',
  status: 'PAID',
  paidAt: '2026-03-28T10:05:00.000Z',
  createdAt: '2026-03-28T10:00:00.000Z',
};

@ApiTags('결제')
@Controller('api/payments')
export class PaymentsController {
  @Post()
  @ApiOperation({ summary: '결제 요청' })
  @ApiResponse({ status: 201, type: PaymentDetailDto, example: PAYMENT_EXAMPLE })
  create(@Body() body: CreatePaymentRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '결제 조회' })
  @ApiResponse({ status: 200, type: PaymentDetailDto, example: PAYMENT_EXAMPLE })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '결제 취소' })
  @ApiResponse({ status: 200, type: PaymentDetailDto, example: { ...PAYMENT_EXAMPLE, status: 'CANCELLED' } })
  cancel(@Param('id') id: string) {
    return {};
  }
}
