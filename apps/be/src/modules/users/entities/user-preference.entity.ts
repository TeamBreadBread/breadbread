import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
import { Category } from "../../bakeries/entities/category.entity";

export enum TravelType {
  SLOW = "SLOW",
  NORMAL = "NORMAL",
  FAST = "FAST",
}

export enum BudgetRange {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

@Entity("user_preference")
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: "enum", enum: TravelType, nullable: true })
  travelType: TravelType;

  @Column({ type: "enum", enum: BudgetRange, nullable: true })
  budgetRange: BudgetRange;

  @Column({ default: false })
  waitingPreference: boolean;

  @Column({ default: false })
  hasBeverage: boolean;

  @Column({ nullable: true })
  breadTypeId: number;

  @OneToOne(() => User, (user) => user.preference)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn()
  breadType: Category;
}
