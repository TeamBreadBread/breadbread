import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  RESERVATION = 'RESERVATION',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

export class NotificationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '예약이 확정되었습니다' })
  title: string;

  @ApiProperty({ example: '3월 28일 오후 2시 대전 빵 코스 예약이 확정되었습니다.' })
  body: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.RESERVATION })
  type: NotificationType;

  @ApiProperty({ example: false })
  read: boolean;

  @ApiProperty({ example: '2026-03-28T10:00:00.000Z' })
  createdAt: string;
}
