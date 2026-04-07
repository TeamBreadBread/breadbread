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
import { CoursesBakery } from "./courses-bakery.entity";
import { Route } from "./route.entity";

@Entity("course")
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  title: string;

  @Column({ default: false })
  isEditorPick: boolean;

  @Column({ length: 50, nullable: true })
  name: string;

  @Column({ length: 50, nullable: true })
  region: string;

  @Column({ length: 50, nullable: true })
  theme: string;

  @Column({ type: "float", nullable: true })
  totalDistance: number;

  @Column({ type: "float", nullable: true })
  estimatedTime: number;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => CoursesBakery, (cb) => cb.course)
  coursesBakeries: CoursesBakery[];

  @OneToMany(() => Route, (route) => route.course)
  routes: Route[];
}
