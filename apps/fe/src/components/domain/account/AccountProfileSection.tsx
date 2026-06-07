import { getSafeImageUrl } from "@/utils/safeImageUrl";

interface AccountProfileSectionProps {
  profileImageUrl?: string;
  onEdit?: () => void;
}

export default function AccountProfileSection({
  profileImageUrl,
  onEdit,
}: AccountProfileSectionProps) {
  const safeProfileImageUrl = getSafeImageUrl(profileImageUrl);

  return (
    <section className="bg-white px-x5 py-x6">
      <div className="flex items-center justify-center">
        <button
          type="button"
          aria-label="프로필 이미지 변경"
          onClick={onEdit}
          className="h-[100px] w-[100px] overflow-hidden rounded-full border border-[#eeeff1] bg-[#f7f8f9]"
        >
          {safeProfileImageUrl ? (
            <img
              src={safeProfileImageUrl}
              alt="프로필 이미지"
              className="h-full w-full object-cover"
            />
          ) : null}
        </button>
      </div>
    </section>
  );
}
