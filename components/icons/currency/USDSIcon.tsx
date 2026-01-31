import Image from 'next/image';

interface USDSIconProps {
  size?: number;
  className?: string;
}

const USDSIcon = ({ size = 24, className = '' }: USDSIconProps) => {
  return (
    <Image
      src="/images/currencies/usds.png"
      alt="USDS"
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
};

export default USDSIcon;
