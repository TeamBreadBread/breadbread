export type CommunitySectionItem = {
  title: string;
  imageHeight?: number;
  imageSrc?: string;
  sectionHeight: number;
  contentType: "image" | "curationCards" | "postList";
  curationItems?: {
    title: string;
    address: string;
    rate: number;
  }[];
  postItems?: {
    content: string;
    date: string;
  }[];
};

export type BottomTabItem = {
  label: string;
  to: "/home" | "/route" | "/bbangteo" | "/my";
};
