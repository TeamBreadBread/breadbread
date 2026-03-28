import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CARD = 'CARD',
  KAKAO_PAY = 'KAKAO_PAY',
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
  @ApiProperty({ format: 'int64' })
  reservationId: number;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  amount?: number;
}

export class PaymentDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  reservationId: number;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty({ format: 'date-time' })
  paidAt: string;
}
