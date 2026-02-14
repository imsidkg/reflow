"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogoIcon } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { clearProfile } from "@/redux/slices/profile";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Palette, LayoutTemplate, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Navbar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const projectId = params.get("project");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile);

  const isInsideProject =
    pathname.includes("canvas") || pathname.includes("style-guide");

  const tabs = [
    {
      label: "Canvas",
      href: `/dashboard/canvas?project=${projectId}`,
      icon: <Palette className="h-4 w-4" />,
    },
    {
      label: "Style Guide",
      href: `/dashboard/style-guide?project=${projectId}`,
      icon: <LayoutTemplate className="h-4 w-4" />,
    },
  ];

  const isActiveTab = (href: string) => {
    return `${pathname}?project=${projectId}` === href;
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
      dispatch(clearProfile());
      toast.success("Logged out successfully");
      router.push("/auth/sign-in");
    } catch (error) {
      toast.error("Failed to logout");
      console.error("Logout failed:", error);
    }
  };

  const getInitial = () => {
    if (profile.firstName) {
      return profile.firstName.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 grid grid-cols-3 p-4">
      <div className="flex items-start">
        <Link href="/projects" className="flex items-center gap-2">
          <LogoIcon />
        </Link>
      </div>

      <div className="flex items-start justify-center">
        {isInsideProject && (
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
                <span
                  className={
                    isActiveTab(tab.href)
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-90"
                  }
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl text-zinc-400 font-bold">
                  {getInitial()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
