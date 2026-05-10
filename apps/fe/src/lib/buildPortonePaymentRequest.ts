import type { PaymentRequest } from "@portone/browser-sdk/v2";
import { EasyPayProvider, PaymentCurrency, PaymentPayMethod } from "@portone/browser-sdk/v2";
import type { PreparePaymentMethod, PreparePaymentMethodDetail } from "@/api/payments";

function mapEasyPayProvider(
  detail: PreparePaymentMethodDetail,
): (typeof EasyPayProvider)[keyof typeof EasyPayProvider] {
  switch (detail) {
    case "NAVER_PAY":
      return EasyPayProvider.NAVERPAY;
    case "KAKAO_PAY":
      return EasyPayProvider.KAKAOPAY;
    case "TOSS_PAY":
      return EasyPayProvider.TOSSPAY;
    default:
      return EasyPayProvider.TOSSPAY;
  }
}

function mapPayMethod(
  method: PreparePaymentMethod,
): (typeof PaymentPayMethod)[keyof typeof PaymentPayMethod] {
  switch (method) {
    case "CARD":
      return PaymentPayMethod.CARD;
    case "TRANSFER":
      return PaymentPayMethod.TRANSFER;
    case "VIRTUAL_ACCOUNT":
      return PaymentPayMethod.VIRTUAL_ACCOUNT;
    case "MOBILE":
      return PaymentPayMethod.MOBILE;
    case "EASY_PAY":
      return PaymentPayMethod.EASY_PAY;
    case "GIFT_CERTIFICATE":
      return PaymentPayMethod.GIFT_CERTIFICATE;
    default:
      return PaymentPayMethod.CARD;
  }
}

export function buildTaxiPortOnePaymentRequest(input: {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  paymentMethod: PreparePaymentMethod;
  paymentMethodDetail: PreparePaymentMethodDetail;
  customerName: string;
  customerPhone: string;
  redirectUrl: string;
}): PaymentRequest {
  const payMethod = mapPayMethod(input.paymentMethod);
  const base = {
    storeId: input.storeId as PaymentRequest["storeId"],
    channelKey: input.channelKey as PaymentRequest["channelKey"],
    paymentId: input.paymentId,
    orderName: input.orderName,
    totalAmount: input.totalAmount,
    currency: PaymentCurrency.KRW,
    payMethod,
    redirectUrl: input.redirectUrl as PaymentRequest["redirectUrl"],
    forceRedirect: true,
    customer: {
      fullName: input.customerName,
      phoneNumber: input.customerPhone.replace(/[^0-9+]/g, "") || undefined,
    },
    ...(payMethod === PaymentPayMethod.EASY_PAY ? {} : { alipayPlus: {} }),
  } as PaymentRequest;

  // EASY_PAY(토스·카카오·네이버 등)는 easyPay 외 옵션(alipayPlus 등)을 넣으면 SDK가
  // 「간편 결제 시 easyPay 옵션만 허용됩니다」로 거절합니다.
  if (payMethod === PaymentPayMethod.EASY_PAY) {
    base.easyPay = {
      easyPayProvider: mapEasyPayProvider(input.paymentMethodDetail),
    };
  }

  if (payMethod === PaymentPayMethod.VIRTUAL_ACCOUNT) {
    base.virtualAccount = {};
  }

  if (payMethod === PaymentPayMethod.TRANSFER) {
    base.transfer = {};
  }

  if (payMethod === PaymentPayMethod.MOBILE) {
    base.mobile = {};
  }

  return base;
}
