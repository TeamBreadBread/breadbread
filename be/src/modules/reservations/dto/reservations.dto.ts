import { ApiProperty } from '@nestjs/swagger';
import { CourseDetailDto } from '../../courses/dto/courses.dto';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class CreateReservationRequestDto {
  @ApiProperty({ format: 'int64' })
  courseId: number;

  @ApiProperty({ format: 'date-time' })
  reservationTime: string;

  @ApiProperty({ minimum: 1 })
  headCount: number;
}

export class UpdateReservationRequestDto {
  @ApiProperty({ format: 'date-time', required: false })
  reservationTime?: string;

  @ApiProperty({ minimum: 1, required: false })
  headCount?: number;
}

export class ReservationSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  courseName: string;

  @ApiProperty({ format: 'date-time' })
  reservationTime: string;

  @ApiProperty({ enum: ReservationStatus })
  status: ReservationStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class ReservationDetailDto extends ReservationSummaryDto {
  @ApiProperty({ type: CourseDetailDto })
  course: CourseDetailDto;

  @ApiProperty()
  headCount: number;

  @ApiProperty()
  totalPrice: number;
}

export class ReservationListResponseDto {
  @ApiProperty({ type: [ReservationSummaryDto] })
  reservations: ReservationSummaryDto[];
}
