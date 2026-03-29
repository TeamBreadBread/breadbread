import { ApiProperty } from '@nestjs/swagger';
import { CourseDetailDto } from '../../courses/dto/courses.dto';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class CreateReservationRequestDto {
  @ApiProperty({ format: 'int64', example: 1 })
  courseId: number;

  @ApiProperty({ format: 'date-time', example: '2026-04-10T14:00:00.000Z' })
  reservationTime: string;

  @ApiProperty({ minimum: 1, example: 2 })
  headCount: number;
}

export class UpdateReservationRequestDto {
  @ApiProperty({ format: 'date-time', required: false, example: '2026-04-11T15:00:00.000Z' })
  reservationTime?: string;

  @ApiProperty({ minimum: 1, required: false, example: 3 })
  headCount?: number;
}

export class ReservationSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '연남동 빵지순례 코스' })
  courseName: string;

  @ApiProperty({ format: 'date-time', example: '2026-04-10T14:00:00.000Z' })
  reservationTime: string;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.CONFIRMED })
  status: ReservationStatus;

  @ApiProperty({ format: 'date-time', example: '2026-03-28T10:00:00.000Z' })
  createdAt: string;
}

export class ReservationDetailDto extends ReservationSummaryDto {
  @ApiProperty({ type: CourseDetailDto })
  course: CourseDetailDto;

  @ApiProperty({ example: 2 })
  headCount: number;

  @ApiProperty({ example: 45000 })
  totalPrice: number;
}

export class ReservationListResponseDto {
  @ApiProperty({ type: [ReservationSummaryDto] })
  reservations: ReservationSummaryDto[];
}
