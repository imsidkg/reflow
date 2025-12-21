import { NextRequest, NextResponse } from "next/server";
import { deleteSession, clearAuthCookie, getTokenFromCookies } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
  try {
    const token = await getTokenFromCookies();

    if (!token) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      );
    }

    await deleteSession(token);
    await clearAuthCookie();

    return NextResponse.json({
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
};
