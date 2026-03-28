import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentRequestDto, PaymentDetailDto } from './dto/payments.dto';

@ApiTags('결제')
@Controller('api/payments')
export class PaymentsController {
  @Post()
  @ApiOperation({ summary: '결제 요청' })
  @ApiResponse({ status: 201, type: PaymentDetailDto })
  create(@Body() body: CreatePaymentRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '결제 조회' })
  @ApiResponse({ status: 200, type: PaymentDetailDto })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '결제 취소' })
  @ApiResponse({ status: 200, type: PaymentDetailDto })
  cancel(@Param('id') id: string) {
    return {};
  }
}
