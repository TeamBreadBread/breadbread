import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Menu } from "./menu.entity";

export enum BakeryType {
  BAKERY = "BAKERY",
  CAFE = "CAFE",
  DESSERT = "DESSERT",
}

@Entity("bakery")
export class Bakery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "enum", enum: BakeryType })
  bakeryType: BakeryType;

  @Column({ length: 255 })
  address: string;

  @Column({ type: "decimal", precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7 })
  longitude: number;

  @Column({ length: 100, nullable: true })
  closedDays: string;

  @Column({ length: 100, nullable: true })
  openingHours: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDineInAvailable: boolean;

  @Column({ default: false })
  isParkingAvailable: boolean;

  @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
  waitRisk: number;

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Menu, (menu) => menu.bakery)
  menus: Menu[];
}
