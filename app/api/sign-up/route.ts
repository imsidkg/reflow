import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { createSession, setAuthCookie } from "@/lib/auth";

export const POST = async (req: NextRequest) => {
  try {
    const { email, firstName, lastName, password } = await req.json();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, { session, token }] = await prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        const sessionData = await createSession(newUser.id);

        return [newUser, sessionData];
      }
    );

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Sign-up error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
};
