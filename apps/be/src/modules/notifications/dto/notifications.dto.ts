import { ApiProperty } from '@nestjs/swagger';
import { NotificationDto } from '../../../common/dto/notification.dto';

export class RegisterFcmTokenDto {
  @ApiProperty({ example: 'fCM_token_abc123xyz' })
  token: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationDto] })
  notifications: NotificationDto[];
}
