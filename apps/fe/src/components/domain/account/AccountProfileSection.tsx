import { resolveProfileImageUrl } from "@/utils/defaultProfileAvatar";

interface AccountProfileSectionProps {
  profileImageUrl?: string | null;
  profileAvatarSeed?: string;
  onEdit?: () => void;
}

export default function AccountProfileSection({
  profileImageUrl,
  profileAvatarSeed,
  onEdit,
}: AccountProfileSectionProps) {
  const displayProfileImageUrl = resolveProfileImageUrl(profileImageUrl, profileAvatarSeed);

  return (
    <section className="bg-white px-x5 py-x6">
      <div className="flex items-center justify-center">
        <button
          type="button"
          aria-label="프로필 이미지 변경"
          onClick={onEdit}
          className="h-[100px] w-[100px] overflow-hidden rounded-full border border-[#eeeff1] bg-[#f7f8f9]"
        >
          <img
            src={displayProfileImageUrl}
            alt="프로필 이미지"
            className="h-full w-full object-cover"
          />
        </button>
      </div>
    </section>
  );
}
