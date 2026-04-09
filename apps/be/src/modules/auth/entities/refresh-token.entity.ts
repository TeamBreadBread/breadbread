import { User } from "src/modules/users/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("refresh_token")
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("IDX_TOKEN")
  @Column({ type: "varchar", length: 500, unique: true })
  token: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @Column({ type: "timestamp" })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isRevoked: boolean;
}
