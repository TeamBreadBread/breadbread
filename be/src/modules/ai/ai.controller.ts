import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('AI')
@Controller('api/ai')
export class AiController {
  @Post('chat')
  @ApiOperation({ summary: 'AI 에이전트 채팅 (SSE 스트리밍)' })
  chat(@Body() body: { message: string }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('data: {"content": ""}\n\n');
    res.end();
  }
}
