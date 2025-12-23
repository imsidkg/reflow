"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Palette, LayoutTemplate } from "lucide-react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const tabs = [
    {
      label: "Canvas",
      href: `/projects/${projectId}/canvas`,
      icon: <Palette className="h-4 w-4" />,
    },
    {
      label: "Style Guide",
      href: `/projects/${projectId}/style-guide`,
      icon: <LayoutTemplate className="h-4 w-4" />,
    },
  ];

  const isActiveTab = (href: string) => pathname === href;

  return (
    <div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.08] p-2 backdrop-blur-xl">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                isActiveTab(tab.href)
                  ? "border border-white/[0.16] bg-white/[0.12] text-white backdrop-blur-sm"
                  : "border border-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200",
              ].join(" ")}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
