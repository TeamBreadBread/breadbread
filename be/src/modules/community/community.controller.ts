import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('빵뮤니티')
@Controller('api/community')
export class CommunityController {
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  findAll(@Query() query: any) {
    return { posts: [], total: 0 };
  }

  @Post()
  @ApiOperation({ summary: '게시글 작성' })
  create(@Body() body: any) {
    return {};
  }

  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Patch(':id')
  @ApiOperation({ summary: '게시글 수정' })
  update(@Param('id') id: string, @Body() body: any) {
    return {};
  }

  @Delete(':id')
  @ApiOperation({ summary: '게시글 삭제' })
  remove(@Param('id') id: string) {
    return {};
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '댓글 목록 조회' })
  getComments(@Param('id') id: string) {
    return { comments: [] };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '댓글 작성' })
  createComment(@Param('id') id: string, @Body() body: any) {
    return {};
  }
}
