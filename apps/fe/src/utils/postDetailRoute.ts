import type { PostSummary, PostType } from "@/api/posts";

export function postDetailRoute(post: Pick<PostSummary, "id" | "postType">): {
  to: "/bbangteo-board-post-detail" | "/bbangteo-bbangticle-post-detail";
  search: { id: number };
} {
  return post.postType === "FREE"
    ? { to: "/bbangteo-board-post-detail", search: { id: post.id } }
    : { to: "/bbangteo-bbangticle-post-detail", search: { id: post.id } };
}

export function postTypeLabel(postType: PostType): string {
  switch (postType) {
    case "FREE":
      return "자유 게시판";
    case "NOTICE":
      return "공지";
    case "ARTICLE":
      return "빵티클";
    default:
      return "게시글";
  }
}
