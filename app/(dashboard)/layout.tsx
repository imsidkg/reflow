"use client";
import { Suspense } from "react";
import Navbar from "@/components/(dashboard)/navbar";
import { useAppDispatch } from "@/redux/hooks";
import { setProfile } from "@/redux/slices/profile";
import axios from "axios";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axios.get("/api/auth/session");
      if (res.data.authenticated) {
        dispatch(
          setProfile({
            id: res.data.user.id,
            email: res.data.user.email,
            firstName: res.data.user.firstName,
            lastName: res.data.user.lastName,
            image: null,
          })
        );
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="bg-zinc-950 min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      {children}
    </div>
  );
}
