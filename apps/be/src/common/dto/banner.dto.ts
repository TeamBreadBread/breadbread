import { ApiProperty } from '@nestjs/swagger';

export class BannerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://cdn.breadbread.kr/banners/spring-event.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'https://breadbread.kr/events/spring' })
  linkUrl: string;
}
