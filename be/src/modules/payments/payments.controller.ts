import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('결제')
@Controller('api/payments')
export class PaymentsController {
  @Post()
  @ApiOperation({ summary: '결제 요청' })
  create(@Body() body: any) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '결제 조회' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '결제 취소' })
  cancel(@Param('id') id: string, @Body() body: any) {
    return {};
  }
}
