import { ApiProperty } from '@nestjs/swagger';

export class BannerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  linkUrl: string;
}
