import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json({
        message: "User does not exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const token = jwt.sign({ hashedPassword }, "supersecretkey", {
      expiresIn: "1h",
    });
    (await cookies()).set("access-token", token, {
      path: "/",
      maxAge: 300,
      httpOnly: true,
      secure: false,
    });

    const session = await prisma.session.create({
      data: {
        token,
        userId: user.id,
      },
    });

    return NextResponse.json({
      session,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: err }, { status: 400 });
  }
};
