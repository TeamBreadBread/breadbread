import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterFcmTokenDto, NotificationListResponseDto } from './dto/notifications.dto';

@ApiTags('알림')
@Controller('api/notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiResponse({
    status: 200,
    type: NotificationListResponseDto,
    example: {
      notifications: [
        { id: 1, title: '예약이 확정되었습니다', body: '4월 1일 은행동 빵지순례 코스 예약이 확정되었습니다.', read: false, createdAt: '2026-03-28T09:00:00.000Z' },
        { id: 2, title: '결제가 완료되었습니다', body: '45,000원 결제가 완료되었습니다.', read: true, createdAt: '2026-03-28T08:00:00.000Z' },
      ],
    },
  })
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
