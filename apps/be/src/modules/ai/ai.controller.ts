import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AiChatRequestDto } from './dto/ai.dto';

@ApiTags('AI')
@Controller('api/ai')
export class AiController {
  @Post('chat')
  @ApiOperation({ summary: 'AI 에이전트 채팅 (SSE 스트리밍)' })
  @ApiResponse({ status: 200, description: 'text/event-stream SSE 응답' })
  chat(@Body() body: AiChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('data: {"content": ""}\n\n');
    res.end();
  }
}
