import React from 'react'
import { useAccount} from 'wagmi';
import { useTokenBalance } from '@/app/utils/blockchainUtils';
const CryptoBalance = ({
  currency,
  blockchain,
}: {
  currency: string
  blockchain: string
}) => { 
    const { isConnected } = useAccount();   

    
  const balance = useTokenBalance(currency, blockchain);

  return (
    <div className='flex gap-2'>
        {isConnected && (
            <>
                <p className='text-color4 text-sm font-medium'> Balance :</p>
                <p className='text-color4 text-sm font-medium'>{balance}</p>
            </>
        )}
        {!isConnected && (
            <p className='text-color4 text-sm font-medium'>Balance : 0</p>
        )}
    </div>
  )
}

export default CryptoBalance