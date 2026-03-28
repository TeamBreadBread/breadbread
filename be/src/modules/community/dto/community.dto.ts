import { ApiProperty } from '@nestjs/swagger';

export class CreatePostRequestDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String], required: false })
  imageUrls?: string[];
}

export class UpdatePostRequestDto {
  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  content?: string;

  @ApiProperty({ type: [String], required: false })
  imageUrls?: string[];
}

export class PostSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  authorName: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class PostDetailDto extends PostSummaryDto {
  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  imageUrls: string[];

  @ApiProperty()
  liked: boolean;
}

export class PostListResponseDto {
  @ApiProperty({ type: [PostSummaryDto] })
  posts: PostSummaryDto[];

  @ApiProperty()
  total: number;
}

export class CommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  authorName: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentDto] })
  comments: CommentDto[];
}

export class CreateCommentRequestDto {
  @ApiProperty()
  content: string;
}
