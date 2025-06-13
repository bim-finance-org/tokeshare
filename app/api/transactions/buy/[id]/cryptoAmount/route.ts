import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * PUT to update the amount of a buy transaction
 * @param request - The request object
 * @param params - The parameters object
 * @returns The updated transaction
 */
export async function PUT(request: NextRequest, { params }: any) {
	try {
		// check if user is authenticated
		const session = await getServerSession(authOptions);

		// if no session, return 401 Unauthorized
		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized. Please log in." },
				{ status: 401 }
			);
		}

		const id = parseInt(params.id);
		if (isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid transaction ID" },
				{ status: 400 }
			);
		}

		const data = await request.json();

		if (
			data.cryptoAmount === undefined ||
			isNaN(parseFloat(data.cryptoAmount)) ||
			parseFloat(data.cryptoAmount) <= 0
		) {
			return NextResponse.json(
				{ error: "Invalid amount. Must be a positive number." },
				{ status: 400 }
			);
		}

		const transaction = await prisma.buyTransaction.findUnique({
			where: { id },
		});

		if (!transaction) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 }
			);
		}

		const updatedTransaction = await prisma.buyTransaction.update({
			where: { id },
			data: {
				cryptoAmount: parseFloat(data.cryptoAmount),
			},
		});

		return NextResponse.json(updatedTransaction);
	} catch (error) {
		return NextResponse.json(
			{ error: "Error updating transaction amount" },
			{ status: 500 }
		);
	}
}
