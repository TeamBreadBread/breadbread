import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { AiCourse } from "./ai-course.entity";
import { Bakery } from "../../bakeries/entities/bakery.entity";

@Entity("ai_course_bakery")
export class AiCoursesBakery {
  @PrimaryColumn()
  aiCourseId: number;

  @PrimaryColumn()
  bakeryId: number;

  @Column()
  visitOrder: number;

  @Column({ type: "text", nullable: true })
  recommendReason: string;

  @ManyToOne(() => AiCourse, (aiCourse) => aiCourse.aiCoursesBakeries)
  @JoinColumn()
  aiCourse: AiCourse;

  @ManyToOne(() => Bakery)
  @JoinColumn()
  bakery: Bakery;
}
