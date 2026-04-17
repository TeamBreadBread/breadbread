import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Bakery } from "../../bakeries/entities/bakery.entity";
import { ReviewImage } from "./review-image.entity";

@Entity("review")
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  bakeryId: number;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text", nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Bakery)
  @JoinColumn()
  bakery: Bakery;

  @OneToMany(() => ReviewImage, (img) => img.review)
  images: ReviewImage[];
}
