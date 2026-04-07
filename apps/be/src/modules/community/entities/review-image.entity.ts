import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Review } from "./review.entity";

@Entity("review_image")
export class ReviewImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reviewId: number;

  @Column({ length: 500 })
  imageUrl: string;

  @ManyToOne(() => Review, (review) => review.images)
  @JoinColumn()
  review: Review;
}
