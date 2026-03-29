import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreatePostRequestDto,
  UpdatePostRequestDto,
  PostListResponseDto,
  PostDetailDto,
  CommentListResponseDto,
  CreateCommentRequestDto,
  CommentDto,
} from './dto/community.dto';

const POST_EXAMPLE = {
  id: 1,
  title: '은행동 빵집 투어 후기',
  content: '오늘 은행동 빵집 투어를 다녀왔어요. 르뺑 베이커리의 크루아상이 정말 맛있었습니다!',
  imageUrls: ['https://cdn.breadbread.kr/community/post1-1.jpg'],
  author: { id: 1, name: '홍길동' },
  likeCount: 24,
  commentCount: 5,
  createdAt: '2026-03-27T15:30:00.000Z',
};

const COMMENT_EXAMPLE = {
  id: 1,
  content: '저도 다녀왔는데 정말 맛있더라고요!',
  author: { id: 2, name: '김철수' },
  createdAt: '2026-03-27T16:00:00.000Z',
};

@ApiTags('빵뮤니티')
@Controller('api/community')
export class CommunityController {
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, type: PostListResponseDto, example: { posts: [POST_EXAMPLE], total: 1 } })
  findAll(@Query() query: any) {
    return { posts: [], total: 0 };
  }

  @Post()
  @ApiOperation({ summary: '게시글 작성' })
  @ApiResponse({ status: 201, type: PostDetailDto, example: POST_EXAMPLE })
  create(@Body() body: CreatePostRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, type: PostDetailDto, example: POST_EXAMPLE })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, type: PostDetailDto, example: { ...POST_EXAMPLE, title: '수정된 제목' } })
  update(@Param('id') id: string, @Body() body: UpdatePostRequestDto) {
    return {};
  }

  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return {};
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '댓글 목록 조회' })
  @ApiResponse({ status: 200, type: CommentListResponseDto, example: { comments: [COMMENT_EXAMPLE] } })
  getComments(@Param('id') id: string) {
    return { comments: [] };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '댓글 작성' })
  @ApiResponse({ status: 201, type: CommentDto, example: COMMENT_EXAMPLE })
  createComment(@Param('id') id: string, @Body() body: CreateCommentRequestDto) {
    return {};
  }
}
