import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Course } from "./course.entity";
import { Bakery } from "../../bakeries/entities/bakery.entity";

@Entity("course_bakery")
export class CoursesBakery {
  @PrimaryColumn()
  courseId: number;

  @PrimaryColumn()
  bakeryId: number;

  @Column()
  visitOrder: number;

  @Column({ type: "text", nullable: true })
  recommendReason: string;

  @ManyToOne(() => Course, (course) => course.coursesBakeries)
  @JoinColumn()
  course: Course;

  @ManyToOne(() => Bakery)
  @JoinColumn()
  bakery: Bakery;
}
