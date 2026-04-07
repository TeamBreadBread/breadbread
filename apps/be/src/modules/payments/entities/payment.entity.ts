import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Reservation } from "../../reservations/entities/reservation.entity";

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

@Entity("payment")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  reservationId: number;

  @Column({ length: 100, nullable: true })
  pgTransactionId: string;

  @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column()
  totalAmount: number;

  @Column({ length: 20, nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  refundAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Reservation)
  @JoinColumn()
  reservation: Reservation;
}
