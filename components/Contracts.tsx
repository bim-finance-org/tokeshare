import React from "react";
import Link from "next/link";

const Contracts = ({ polygonContract }: { polygonContract: string }) => {
	return (
		<div className='flex items-center gap-4'>
			<h1 className='text-xl text-color4 font-medium'>VIEW SMART CONTRACTS</h1>
			<div className='flex gap-2'>
				<Link
					target='_blank'
					href={"https://polygonscan.com/address/" + polygonContract}
					className='w-20 flex items-center justify-center px-6 py-2 bg-color2 text-color1 rounded hover:scale-105 transition'
				>
					POL
				</Link>
			</div>
		</div>
	);
};

export default Contracts;
