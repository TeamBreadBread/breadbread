import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MainResponseDto } from './dto/main.dto';

@ApiTags('메인')
@Controller('api/main')
export class MainController {
  @Get()
  @ApiOperation({ summary: '메인 화면 출력' })
  @ApiResponse({
    status: 200,
    type: MainResponseDto,
    example: {
      banners: [
        { id: 1, imageUrl: 'https://cdn.breadbread.kr/banners/spring-event.jpg', linkUrl: 'https://breadbread.kr/events/spring' },
        { id: 2, imageUrl: 'https://cdn.breadbread.kr/banners/new-course.jpg', linkUrl: 'https://breadbread.kr/courses/new' },
      ],
      recommendedCourses: [
        { id: 1, name: '은행동 빵지순례 코스', thumbnailUrl: 'https://cdn.breadbread.kr/courses/eunhaeng.jpg', bakeryCount: 4, estimatedTime: 120 },
        { id: 2, name: '둔산동 브런치 코스', thumbnailUrl: 'https://cdn.breadbread.kr/courses/dunsan.jpg', bakeryCount: 3, estimatedTime: 90 },
      ],
      popularBakeries: [
        { id: 1, name: '르뺑 베이커리', address: '대전시 중구 은행동 123-4', lat: 36.3280, lng: 127.4272, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/lepain.jpg' },
        { id: 2, name: '밀도', address: '대전시 서구 둔산동 456-7', lat: 36.3540, lng: 127.3796, thumbnailUrl: 'https://cdn.breadbread.kr/bakeries/mildo.jpg' },
      ],
    },
  })
  getMain() {
    return { banners: [], recommendedCourses: [], popularBakeries: [] };
  }
}
