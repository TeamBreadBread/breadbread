import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { UserBadge } from "./user-badge.entity";

@Entity("badge")
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => UserBadge, (ub) => ub.badge)
  userBadges: UserBadge[];
}
