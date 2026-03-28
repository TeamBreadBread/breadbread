import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterFcmTokenDto, NotificationListResponseDto } from './dto/notifications.dto';

@ApiTags('알림')
@Controller('api/notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  findAll() {
    return { notifications: [] };
  }

  @Post('token')
  @ApiOperation({ summary: 'FCM 토큰 등록' })
  @ApiResponse({ status: 201 })
  registerToken(@Body() body: RegisterFcmTokenDto) {
    return {};
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({ status: 200 })
  markAsRead(@Param('id') id: string) {
    return {};
  }
}
