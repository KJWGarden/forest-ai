import type { Metadata } from "next";
import { ChatShell } from "@/features/shell/ui/chat-shell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "숲체험 AI 포레",
      },
    ],
  },
};

export default function Page() {
  return <ChatShell />;
}
