import { Injectable } from "@nestjs/common";
import { ISmsProvider } from "../interfaces/sms-provider.interface";
import { SolapiMessageService } from "solapi";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CoolsmsProvider implements ISmsProvider {
  private readonly client: SolapiMessageService;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.client = new SolapiMessageService(
      config.get("COOLSMS_API_KEY"),
      config.get("COOLSMS_API_SECRET"),
    );
    this.from = config.get("COOLSMS_SENDER");
  }
  async sendSms(to: string, message: string): Promise<void> {
    await this.client.sendOne({ to, from: this.from, text: message });
  }
}
