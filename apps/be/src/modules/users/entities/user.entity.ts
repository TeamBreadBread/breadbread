import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { SsoAccount } from "../../auth/entities/sso-account.entity";
import { PhoneVerification } from "../../auth/entities/phone-verification.entity";
import { UserPreference } from "./user-preference.entity";
import { UserBadge } from "./user-badge.entity";
import { Driver } from "./driver.entity";

export enum UserRole {
  USER = "USER",
  BUSINESS = "BUSINESS",
  DRIVER = "DRIVER",
}

@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  loginId: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100, nullable: true, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  telecom: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  termsAgreed: boolean;

  @Column({ default: false })
  privacyAgreed: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => SsoAccount, (sso) => sso.user)
  ssoAccounts: SsoAccount[];

  @OneToMany(() => PhoneVerification, (pv) => pv.user)
  phoneVerifications: PhoneVerification[];

  @OneToOne(() => UserPreference, (pref) => pref.user)
  preference: UserPreference;

  @OneToMany(() => UserBadge, (ub) => ub.user)
  userBadges: UserBadge[];

  @OneToOne(() => Driver, (driver) => driver.user)
  driver: Driver;
}
