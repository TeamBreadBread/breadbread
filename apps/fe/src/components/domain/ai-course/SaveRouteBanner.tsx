import ToastBanner from "@/components/common/feedback/ToastBanner";

interface SaveRouteBannerProps {
  onActionClick?: () => void;
}

export default function SaveRouteBanner({ onActionClick }: SaveRouteBannerProps) {
  return (
    <ToastBanner
      message="루트에 저장되었습니다."
      actionText="이동하기"
      onActionClick={onActionClick}
    />
  );
}
