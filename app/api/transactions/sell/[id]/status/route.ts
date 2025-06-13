import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

/**
 * PUT to update the status of a sell transaction
 * @param request - The request object
 * @param params - The parameters object
 * @returns The updated transaction
 */
export async function PUT(request: NextRequest, { params }: { params: any }) {
	try {
		// Check if user is authenticated
		const session = await getServerSession(authOptions);

		// If no session, return 401 Unauthorized
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
			!data.status ||
			!["pending", "completed", "failed", "received"].includes(data.status)
		) {
			return NextResponse.json(
				{
					error:
						"Invalid status. Allowed values are: pending, completed, failed, received",
				},
				{ status: 400 }
			);
		}

		const transaction = await prisma.sellTransaction.findUnique({
			where: { id },
		});

		if (!transaction) {
			return NextResponse.json(
				{ error: "Transaction not found" },
				{ status: 404 }
			);
		}

		const updatedTransaction = await prisma.sellTransaction.update({
			where: { id },
			data: {
				status: data.status,
			},
		});

		return NextResponse.json(updatedTransaction);
	} catch (error) {
		return NextResponse.json(
			{ error: "Error updating transaction status" },
			{ status: 500 }
		);
	}
}
