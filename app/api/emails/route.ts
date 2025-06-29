import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const EMAIL_ALREADY_EXISTS_CODE = "P2002";

const emailSchema = z.object({
	email: z.string().email(),
});

async function parseAndValidateEmail(request: Request) {
  const rawEmail = await request.json();
  const result = emailSchema.safeParse(rawEmail);
  if (!result.success || !result.data) return null;
  return result.data.email;
}

async function saveEmail(email: string) {
  try {
    await prisma.emails.create({ data: { email } });
    return { success: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === EMAIL_ALREADY_EXISTS_CODE) {
      return { success: true };
    }
    return { success: false, status: 500 };
  }
}

/**
 * POST to create a new email
 * @param request - The request object
 * @returns The success of the operation
 */
export async function POST(request: Request) {
  const email = await parseAndValidateEmail(request);
  if (!email) return NextResponse.json({ success: false }, { status: 422 });

  const result = await saveEmail(email);
  return NextResponse.json({ success: result.success }, result.status ? { status: result.status } : {});
}
