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
import { PostLike } from "./post-like.entity";
import { Comment } from "./comment.entity";

@Entity("post")
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  bakeryId: number;

  @Column({ length: 50 })
  title: string;

  @Column({ type: "text", nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Bakery, { nullable: true })
  @JoinColumn()
  bakery: Bakery;

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
