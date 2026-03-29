import { ApiProperty } from '@nestjs/swagger';

export class AiChatRequestDto {
  @ApiProperty({ example: '달달한 빵집 코스 추천해줘' })
  message: string;
}
