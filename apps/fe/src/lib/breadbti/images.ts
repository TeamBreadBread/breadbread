import type { MbtiType } from "@/lib/breadbti/mbti";

import breadHomeImage from "@/assets/breadbti/BreadBTI_home.png";
import ENFJImage from "@/assets/breadbti/ENFJ.png";
import ENFPImage from "@/assets/breadbti/ENFP.png";
import ENTJImage from "@/assets/breadbti/ENTJ.png";
import ENTPImage from "@/assets/breadbti/ENTP.png";
import ESFJImage from "@/assets/breadbti/ESFJ.png";
import ESFPImage from "@/assets/breadbti/ESFP.png";
import ESTJImage from "@/assets/breadbti/ESTJ.png";
import ESTPImage from "@/assets/breadbti/ESTP.png";
import INFJImage from "@/assets/breadbti/INFJ.png";
import INFPImage from "@/assets/breadbti/INFP.png";
import INTJImage from "@/assets/breadbti/INTJ.png";
import INTPImage from "@/assets/breadbti/INTP.png";
import ISFJImage from "@/assets/breadbti/ISFJ.png";
import ISFPImage from "@/assets/breadbti/ISFP.png";
import ISTJImage from "@/assets/breadbti/ISTJ.png";
import ISTPImage from "@/assets/breadbti/ISTP.png";

export const BREAD_BTI_HOME_IMAGE = breadHomeImage;

export const MBTI_IMAGE_MAP: Record<MbtiType, string> = {
  INTJ: INTJImage,
  INTP: INTPImage,
  ENTJ: ENTJImage,
  ENTP: ENTPImage,
  INFJ: INFJImage,
  INFP: INFPImage,
  ENFJ: ENFJImage,
  ENFP: ENFPImage,
  ISTJ: ISTJImage,
  ISFJ: ISFJImage,
  ESTJ: ESTJImage,
  ESFJ: ESFJImage,
  ISTP: ISTPImage,
  ISFP: ISFPImage,
  ESTP: ESTPImage,
  ESFP: ESFPImage,
};

export const BREAD_EMOJI_MAP: Record<string, string> = {
  크로와상: "🥐",
  "초코 크로와상": "🥐",
  식빵: "🍞",
  통밀빵: "🍞",
  버터롤: "🍞",
  바게트: "🥖",
  마늘바게트: "🥖",
  프레첼: "🥨",
  베이글: "🥯",
  샌드위치: "🥪",
  핫도그: "🌭",
  도넛: "🍩",
  컵케이크: "🧁",
  치즈케이크: "🍰",
  "생크림 케이크": "🎂",
  생크림케이크: "🎂",
  "딸기 케이크": "🍰",
  딸기케이크: "🍰",
};
