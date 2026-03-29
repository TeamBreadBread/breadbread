import { ApiProperty } from '@nestjs/swagger';

export class BakeryMenuDto {
  @ApiProperty({ example: '크루아상' })
  name: string;

  @ApiProperty({ example: 4500 })
  price: number;

  @ApiProperty({ example: 'https://cdn.breadbread.kr/menus/croissant.jpg' })
  imageUrl: string;
}

export class BakerySummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '르뺑 베이커리' })
  name: string;

  @ApiProperty({ example: '대전시 중구 은행동 123-4' })
  address: string;

  @ApiProperty({ format: 'double', example: 36.3280 })
  lat: number;

  @ApiProperty({ format: 'double', example: 127.4272 })
  lng: number;

  @ApiProperty({ example: 'https://cdn.breadbread.kr/bakeries/lepain.jpg' })
  thumbnailUrl: string;
}

export class BakeryDetailDto extends BakerySummaryDto {
  @ApiProperty({ example: '은행동 골목에 위치한 프랑스식 베이커리입니다.' })
  description: string;

  @ApiProperty({ example: '08:00 - 21:00' })
  openHours: string;

  @ApiProperty({ example: '02-1234-5678' })
  phone: string;

  @ApiProperty({ type: [BakeryMenuDto] })
  menus: BakeryMenuDto[];
}

export class BakeryListResponseDto {
  @ApiProperty({ type: [BakerySummaryDto] })
  bakeries: BakerySummaryDto[];

  @ApiProperty({ example: 42 })
  total: number;
}
