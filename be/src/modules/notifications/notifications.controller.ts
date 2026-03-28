import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('알림')
@Controller('api/notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  findAll() {
    return { notifications: [] };
  }

  @Post('token')
  @ApiOperation({ summary: 'FCM 토큰 등록' })
  registerToken(@Body() body: { token: string }) {
    return {};
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markAsRead(@Param('id') id: string) {
    return {};
  }
}
