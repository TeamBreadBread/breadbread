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

@ApiTags('빵뮤니티')
@Controller('api/community')
export class CommunityController {
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiResponse({ status: 200, type: PostListResponseDto })
  findAll(@Query() query: any) {
    return { posts: [], total: 0 };
  }

  @Post()
  @ApiOperation({ summary: '게시글 작성' })
  @ApiResponse({ status: 201, type: PostDetailDto })
  create(@Body() body: CreatePostRequestDto) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, type: PostDetailDto })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, type: PostDetailDto })
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
  @ApiResponse({ status: 200, type: CommentListResponseDto })
  getComments(@Param('id') id: string) {
    return { comments: [] };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '댓글 작성' })
  @ApiResponse({ status: 201, type: CommentDto })
  createComment(@Param('id') id: string, @Body() body: CreateCommentRequestDto) {
    return {};
  }
}
