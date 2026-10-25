import type { Metadata } from "next";
import { StandaloneShell } from "@/components/layout/standalone-shell";

export const metadata: Metadata = {
  title: "DegreeLabs – Impact Fellowship Home",
  description: "Fellowship journey overview and phase progression",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StandaloneShell>{children}</StandaloneShell>;
}
