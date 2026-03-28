import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  RESERVATION = 'RESERVATION',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

export class NotificationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  read: boolean;

  @ApiProperty()
  createdAt: string;
}
