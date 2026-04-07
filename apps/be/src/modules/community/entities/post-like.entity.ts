import { Entity, ManyToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from "typeorm";
import { Post } from "./post.entity";
import { User } from "../../users/entities/user.entity";

@Entity("post_like")
export class PostLike {
  @PrimaryColumn()
  postId: number;

  @PrimaryColumn()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.likes)
  @JoinColumn()
  post: Post;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
