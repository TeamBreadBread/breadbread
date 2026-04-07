import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { AiCoursesBakery } from "./ai-courses-bakery.entity";

@Entity("ai_course")
export class AiCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "float", nullable: true })
  totalDistance: number;

  @Column({ nullable: true })
  estimatedCost: number;

  @Column({ type: "float", nullable: true })
  estimatedTime: number;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => AiCoursesBakery, (acb) => acb.aiCourse)
  aiCoursesBakeries: AiCoursesBakery[];
}
