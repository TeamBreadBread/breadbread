import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum DriverStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

@Entity("driver")
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: "enum", enum: DriverStatus, default: DriverStatus.INACTIVE })
  status: DriverStatus;

  @Column({ length: 20 })
  carNumber: string;

  @Column({ type: "float", nullable: true })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => User, (user) => user.driver)
  @JoinColumn()
  user: User;
}
