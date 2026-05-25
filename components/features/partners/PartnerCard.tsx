import React from 'react';
import Image from 'next/image';
import ArrowIcon from '../../icons/arrows/ArrowIcon';
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
      className="group flex h-full flex-col rounded-2xl border border-black/5 bg-color7 p-6 shadow-sm
                 transition-all duration-300 hover:-translate-y-1.5 hover:border-color2 hover:shadow-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-color1">
          <Image src={logo} alt={`${name} logo`} fill sizes="64px" className="object-contain p-2.5" />
        </div>
        <span className="rounded-full bg-color5 px-3 py-1 text-xs text-color4">{category}</span>
      </div>

      <h3 className="mt-5 text-xl text-color4">{name}</h3>
      <p className="mt-2 flex-grow text-sm leading-relaxed text-color6 line-clamp-5">{description}</p>

      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-color2">
        Visit website
        <ArrowIcon size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </a>
  );
};

export default PartnerCard;
