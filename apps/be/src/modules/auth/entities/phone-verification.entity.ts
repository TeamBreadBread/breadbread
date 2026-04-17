import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum AuthType {
  SMS = "SMS",
  PASS = "PASS",
}

@Entity("phone_verification")
export class PhoneVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ length: 20 })
  phone: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ length: 10 })
  code: string;

  @Column()
  expiredAt: Date;

  @Column({ type: "enum", enum: AuthType })
  authType: AuthType;

  @ManyToOne(() => User, (user) => user.phoneVerifications, { nullable: true })
  @JoinColumn()
  user: User;
}
