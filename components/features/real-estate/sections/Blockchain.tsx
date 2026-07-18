import React from 'react';
import { Boxes, FileCode2, Fingerprint, Wallet } from 'lucide-react';
import { AddressLink, PanelHeader, StatTile } from '@/components/shared/InfoTile';

const CONTRACT_ADDRESS = '0x3d4Df7BD7Ea3f305Ac3A4065019B96d382834B71';
const OWNER_WALLET = '0xCFac885Fa38EeDf7AaffFa9F69A938d64453027E';

const Blockchain = () => {
  return (
    <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
      <PanelHeader icon={Boxes} title="Blockchain" subtitle="On-chain identity" />

      <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
        <StatTile icon={Boxes} label="Network">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
            <span className="h-1.5 w-1.5 rounded-full bg-color2" />
            Polygon
          </span>
        </StatTile>

        <StatTile icon={Fingerprint} label="Identifier">
          <span className="font-medium text-color4">TokeShare Gold Gram</span>
        </StatTile>

        <StatTile icon={FileCode2} label="Contract Address">
          <AddressLink href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}`} value={CONTRACT_ADDRESS} />
        </StatTile>

        <StatTile icon={Wallet} label="Owner Wallet">
          <AddressLink href={`https://polygonscan.com/address/${OWNER_WALLET}`} value={OWNER_WALLET} />
        </StatTile>
      </div>
    </div>
  );
};

export default Blockchain;
