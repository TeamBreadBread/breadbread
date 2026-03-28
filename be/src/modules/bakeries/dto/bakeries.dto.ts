import { ApiProperty } from '@nestjs/swagger';

export class BakeryMenuDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  imageUrl: string;
}

export class BakerySummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ format: 'double' })
  lat: number;

  @ApiProperty({ format: 'double' })
  lng: number;

  @ApiProperty()
  thumbnailUrl: string;
}

export class BakeryDetailDto extends BakerySummaryDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  openHours: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ type: [BakeryMenuDto] })
  menus: BakeryMenuDto[];
}

export class BakeryListResponseDto {
  @ApiProperty({ type: [BakerySummaryDto] })
  bakeries: BakerySummaryDto[];

  @ApiProperty()
  total: number;
}
