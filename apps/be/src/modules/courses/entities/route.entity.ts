import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Course } from "./course.entity";

export enum RouteStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

@Entity("route")
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseId: number;

  @Column({ type: "enum", enum: RouteStatus, default: RouteStatus.ACTIVE })
  status: RouteStatus;

  @Column({ nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @ManyToOne(() => Course, (course) => course.routes)
  @JoinColumn()
  course: Course;
}
