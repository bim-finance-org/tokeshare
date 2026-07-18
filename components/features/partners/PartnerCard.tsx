import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Partner } from './partnersData';

interface PartnerCardProps {
  partner: Partner;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner }) => {
  const { name, category, description, url, logo } = partner;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${name} website`}
      className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-color1 ring-1 ring-inset ring-black/5">
          <Image src={logo} alt={`${name} logo`} fill sizes="56px" className="object-contain p-2.5" />
        </div>
        <span className="rounded-full bg-color1 px-3 py-1 text-xs font-medium text-color4 ring-1 ring-inset ring-black/5">
          {category}
        </span>
      </div>

      <h3 className="mt-4 font-titleSemibold text-lg text-color4">{name}</h3>
      <p className="mt-2 flex-grow text-sm leading-relaxed text-gray-500 line-clamp-5">{description}</p>

      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-titleSemibold text-color2 transition-colors group-hover:text-color4">
        Visit website
        <ExternalLink className="h-4 w-4" />
      </span>
    </a>
  );
};

export default PartnerCard;
