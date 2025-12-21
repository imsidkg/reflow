import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const GET = async (req: NextRequest) => {
  try {
    const sessionData = await getCurrentUser();

    if (!sessionData) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
    });
  } catch (err) {
    console.error("Session check error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Failed to check session" },
      { status: 500 }
    );
  }
};
