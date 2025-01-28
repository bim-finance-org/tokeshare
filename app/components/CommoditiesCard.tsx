import React from "react";
import ArrowIcon from "./icons/ArrowIcon";
import Image from "next/image";

interface CommoditiesCardProps {
	name: string;
	image: string;
	tokenPrice: number;
	year1Perf: number;
	years5Perf: number;
	link: string;
}

const CommoditiesCard: React.FC<CommoditiesCardProps> = ({
	name,
	image,
	tokenPrice,
	year1Perf,
	years5Perf,
}) => {
	return (
		<div className='text-color4 min-w-[280px] max-w-[400px] w-full mx-auto'>
			<div className='relative w-'>
				<Image
					src={image}
					alt={name}
					width={500}
					height={400}
					className='object-contain '
				/>
			</div>
			<div className='bg-color1 rounded-b-3xl p-4 shadow-lg'>
				<div className='flex justify-between items-center'>
					<div className='flex items-center'>
						<div className='border-t-2 border-color4 w-8 mr-2 ml-1'></div>
						<h3>{name}</h3>
					</div>
					<h6 className='text-color2 font-bold text-lg'>{tokenPrice} $</h6>
				</div>

				<div className='mt-2 space-y-1'>
					<div className='flex justify-between'>
						<p className='text-sm'>Performance over 1 year</p>
						<h6 className='font-medium'>{year1Perf} %</h6>
					</div>
					<div className='flex justify-between'>
						<p className='text-sm'>Performance over 5 years</p>
						<h6 className='font-medium'>{years5Perf} %</h6>
					</div>
				</div>
				<div className='flex justify-center mt-4 w-full'>
					{/* <Link href={link} target="_blank" rel="noopener noreferrer"> */}
					<button className=' bg-color2 text-white rounded-full text-sm font-bold hover:scale-105 transition '>
						<div className='flex w-full justify-between items-center px-8'>
							<h6 className='whitespace-nowrap pr-10'>Available Soon</h6>
							<ArrowIcon size={24} />
						</div>
					</button>
					{/* </Link> */}
				</div>
			</div>
		</div>
	);
};

export default CommoditiesCard;
