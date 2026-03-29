import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CARD = 'CARD',
  TOSS_PAY = 'TOSS_PAY',
  STRIPE = 'STRIPE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class CreatePaymentRequestDto {
  @ApiProperty({ format: 'int64', example: 1 })
  reservationId: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.TOSS_PAY })
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, example: 45000 })
  amount?: number;
}

export class PaymentDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  reservationId: number;

  @ApiProperty({ example: 45000 })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.SUCCESS })
  status: PaymentStatus;

  @ApiProperty({ example: 'TOSS_PAY' })
  paymentMethod: string;

  @ApiProperty({ format: 'date-time', example: '2026-03-28T10:05:00.000Z' })
  paidAt: string;
}
