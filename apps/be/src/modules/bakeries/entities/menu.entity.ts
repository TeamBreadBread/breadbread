import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Bakery } from "./bakery.entity";
import { Category } from "./category.entity";

@Entity("menu")
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column()
  bakeryId: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ type: "int" })
  price: number;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @ManyToOne(() => Bakery, (bakery) => bakery.menus)
  @JoinColumn()
  bakery: Bakery;

  @ManyToOne(() => Category, (category) => category.menus, { nullable: true })
  @JoinColumn()
  category: Category;
}
