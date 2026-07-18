import React from 'react';
import AssetCard from '@/components/shared/AssetCard';

const PopularTFTCard = () => (
  <AssetCard
    name="French Tacos"
    image="/images/frenchTacos/TFT_principal.png"
    price="$31.25"
    perfs={[{ label: 'Net yield / year', value: 11.76 }]}
    href="/marketplace/other/french-tacos"
    ctaSymbol="TFT"
  />
);

export default PopularTFTCard;
