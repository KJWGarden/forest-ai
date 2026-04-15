export const siteConfig = {
  name: "숲체험 AI 포레",
  shortName: "포레",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://forest-ai-tau.vercel.app",
  description: "숲에서 만나는 식물 친구! 포레에게 사진을 보여주면 식물 이야기를 들려줘요.",
  ogImage: "/img/for-re_og.png",
  locale: "ko_KR",
} as const;
