import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 37.5563 })
  latitude: number;

  @ApiProperty({ example: 126.9237 })
  longitude: number;
}
