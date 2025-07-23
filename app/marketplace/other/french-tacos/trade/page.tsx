import Exchange from '@/components/marketplace/commodities/Exchange';
import { TOKENS } from '@/config/token';
import React from 'react';

const page = () => {
  return <Exchange token={TOKENS['TFT_001']} />;
};

export default page;
