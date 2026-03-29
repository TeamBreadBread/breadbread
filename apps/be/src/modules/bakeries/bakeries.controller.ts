import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BakeryListResponseDto, BakeryDetailDto } from './dto/bakeries.dto';

@ApiTags('빵집')
@Controller('api/bakeries')
export class BakeriesController {
  @Get()
  @ApiOperation({ summary: '빵집 검색' })
  @ApiResponse({
    status: 200,
    type: BakeryListResponseDto,
    example: {
      bakeries: [
        { id: 1, name: '르뺑 베이커리', address: '대전시 중구 은행동 123-4', lat: 36.3280, lng: 127.4272, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/lepain.jpg', rating: 4.8, reviewCount: 124 },
        { id: 2, name: '밀도', address: '대전시 서구 둔산동 456-7', lat: 36.3540, lng: 127.3796, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/mildo.jpg', rating: 4.6, reviewCount: 89 },
      ],
      total: 2,
    },
  })
  search(@Query() query: any) {
    return { bakeries: [], total: 0 };
  }

  @Get(':id')
  @ApiOperation({ summary: '빵집 상세 조회' })
  @ApiResponse({
    status: 200,
    type: BakeryDetailDto,
    example: {
      id: 1,
      name: '르뺑 베이커리',
      address: '대전시 중구 은행동 123-4',
      lat: 36.3280,
      lng: 127.4272,
      thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/lepain.jpg',
      rating: 4.8,
      reviewCount: 124,
      phone: '042-1234-5678',
      openHours: '09:00 - 21:00',
      description: '은행동의 인기 베이커리입니다.',
      menus: [
        { id: 1, name: '크루아상', price: 4500, imageUrl: 'https://cdn.breadbread.kr/menus/croissant.jpg' },
        { id: 2, name: '소금빵', price: 3500, imageUrl: 'https://cdn.breadbread.kr/menus/saltbread.jpg' },
      ],
    },
  })
  findOne(@Param('id') id: string) {
    return {};
  }
}
