import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Menu } from "./menu.entity";

export enum CategoryType {
  BREAD = "BREAD",
  CAKE = "CAKE",
  COOKIE = "COOKIE",
  BEVERAGE = "BEVERAGE",
  OTHER = "OTHER",
}

@Entity("category")
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "enum", enum: CategoryType })
  type: CategoryType;

  @Column({ length: 50 })
  name: string;

  @OneToMany(() => Menu, (menu) => menu.category)
  menus: Menu[];
}
