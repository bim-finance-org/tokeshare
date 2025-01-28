import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
	} catch {
		return NextResponse.json({ success: false }, { status: 500 });
	}
	return NextResponse.json({ success: true });
}
