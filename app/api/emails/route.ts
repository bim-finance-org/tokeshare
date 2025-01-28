import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const emailSchema = z.object({
	email: z.string().email(),
});

export async function POST(request: Request) {
	const rawEmail = await request.json();
	const email = emailSchema.safeParse(rawEmail);
	if (!email.success || email.data === undefined) {
		return NextResponse.json({ success: false }, { status: 422 });
	}
	try {
		await prisma.emails.create({
			data: {
				email: email.data.email,
			},
		});
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			//unique constraint violation
			if (e.code === "P2002") {
				// return true if email already exists so people can't know that an email is already registered
				return NextResponse.json({ success: true });
			}
		}
		return NextResponse.json({ success: false }, { status: 500 });
	}
	return NextResponse.json({ success: true });
}
