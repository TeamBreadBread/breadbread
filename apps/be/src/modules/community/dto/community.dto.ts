import { ApiProperty } from '@nestjs/swagger';

export class CreatePostRequestDto {
  @ApiProperty({ example: '대전 빵집 투어 후기' })
  title: string;

  @ApiProperty({ example: '오늘 대전 빵지순례를 다녀왔습니다. 성심당, 메이브레드, 라비에벨을 들렀는데...' })
  content: string;

  @ApiProperty({ type: [String], required: false, example: ['https://cdn.breadbread.kr/posts/img1.jpg'] })
  imageUrls?: string[];
}

export class UpdatePostRequestDto {
  @ApiProperty({ required: false, example: '대전 빵집 투어 후기 (수정)' })
  title?: string;

  @ApiProperty({ required: false, example: '수정된 내용입니다.' })
  content?: string;

  @ApiProperty({ type: [String], required: false, example: ['https://cdn.breadbread.kr/posts/img2.jpg'] })
  imageUrls?: string[];
}

export class PostSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '대전 빵집 투어 후기' })
  title: string;

  @ApiProperty({ example: '홍길동' })
  authorName: string;

  @ApiProperty({ example: 24 })
  likeCount: number;

  @ApiProperty({ example: 5 })
  commentCount: number;

  @ApiProperty({ format: 'date-time', example: '2026-03-28T10:00:00.000Z' })
  createdAt: string;
}

export class PostDetailDto extends PostSummaryDto {
  @ApiProperty({ example: '오늘 대전 빵지순례를 다녀왔습니다. 성심당, 메이브레드, 라비에벨을 들렀는데...' })
  content: string;

  @ApiProperty({ type: [String], example: ['https://cdn.breadbread.kr/posts/img1.jpg'] })
  imageUrls: string[];

  @ApiProperty({ example: false })
  liked: boolean;
}

export class PostListResponseDto {
  @ApiProperty({ type: [PostSummaryDto] })
  posts: PostSummaryDto[];

  @ApiProperty({ example: 128 })
  total: number;
}

export class CommentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '김철수' })
  authorName: string;

  @ApiProperty({ example: '저도 다녀왔는데 정말 맛있었어요!' })
  content: string;

  @ApiProperty({ format: 'date-time', example: '2026-03-28T11:00:00.000Z' })
  createdAt: string;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentDto] })
  comments: CommentDto[];
}

export class CreateCommentRequestDto {
  @ApiProperty({ example: '저도 다녀왔는데 정말 맛있었어요!' })
  content: string;
}
