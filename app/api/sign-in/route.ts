import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession, setAuthCookie } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { session, token } = await createSession(user.id);

    await setAuthCookie(token);

    return NextResponse.json({
      message: "Signed in successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Sign-in error:", err);
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
};
