import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const POST = async (req: NextRequest, res: NextResponse) => {
  try {
    const { email, name, password } = await req.json();

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

    const [user, session] = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      const session = await tx.session.create({
        data: {
          token,
          userId: user.id,
        },
      });
      return [user, session];
    });

    return NextResponse.json({
      message: "Data received",
      email,
      name,
      password,
      token,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: err }, { status: 400 });
  }
};
