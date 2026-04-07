import { Entity, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { Badge } from "./badge.entity";

@Entity("user_badge")
export class UserBadge {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  badgeId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.userBadges)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.userBadges)
  @JoinColumn()
  badge: Badge;
}
