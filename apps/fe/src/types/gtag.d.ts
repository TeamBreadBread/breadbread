declare namespace Gtag {
  type GtagCommand = "config" | "event" | "js" | "set" | "consent";

  interface Gtag {
    (
      command: "config",
      targetId: string,
      config?: ControlParams | EventParams | CustomParams,
    ): void;
    (
      command: "event",
      eventName: string,
      eventParams?: ControlParams | EventParams | CustomParams,
    ): void;
    (command: "js", config: Date): void;
    (command: "set", config: CustomParams): void;
    (command: "consent", consentArg: string, consentParams: ConsentParams): void;
  }

  interface ConsentParams {
    ad_storage?: "granted" | "denied";
    analytics_storage?: "granted" | "denied";
    [key: string]: string | undefined;
  }

  interface ControlParams {
    send_page_view?: boolean;
    debug_mode?: boolean;
    [key: string]: string | number | boolean | undefined;
  }

  interface EventParams {
    page_path?: string;
    page_location?: string;
    page_title?: string;
    [key: string]: string | number | boolean | undefined;
  }

  type CustomParams = Record<string, string | number | boolean | undefined>;
}

interface Window {
  dataLayer?: IArguments[];
  gtag?: Gtag.Gtag;
}
