import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Driver } from "../../users/entities/driver.entity";
import { Course } from "../../courses/entities/course.entity";

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity("reservation")
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  driverId: number;

  @Column()
  courseId: number;

  @Column({ type: "date" })
  date: Date;

  @Column()
  headCount: number;

  @Column({ nullable: true })
  deadline: Date;

  @Column({ length: 200, nullable: true })
  departure: string;

  @Column({ type: "float", nullable: true })
  departureLat: number;

  @Column({ type: "float", nullable: true })
  departureLng: number;

  @Column({ type: "enum", enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn()
  driver: Driver;

  @ManyToOne(() => Course)
  @JoinColumn()
  course: Course;
}
