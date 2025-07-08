import React, { ComponentPropsWithRef } from 'react';

const LocationIcon = ({ size = 24, className, ...props }: ComponentPropsWithRef<'svg'> & { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      {...props}
      viewBox="0 0 24.56 33.24"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g>
        <g>
          <path
            fill="currentColor"
            d="M11.79,30.34c-0.32-0.25-0.67-0.46-0.96-0.74c-2.33-2.23-4.41-4.67-6.11-7.41c-1.16-1.86-2.11-3.82-2.62-5.97
              c-0.32-1.33-0.45-2.68-0.29-4.05c0.25-2.16,1.1-4.07,2.54-5.7C5.6,5.06,7.13,4.05,8.94,3.48c1.56-0.49,3.15-0.62,4.77-0.35
              c2.16,0.36,4.03,1.31,5.59,2.84c1.41,1.38,2.34,3.05,2.8,4.97c0.46,1.93,0.32,3.83-0.23,5.71c-0.55,1.9-1.44,3.65-2.47,5.32
              c-1.78,2.88-3.94,5.47-6.35,7.84c-0.21,0.21-0.48,0.35-0.71,0.53C12.14,30.34,11.96,30.34,11.79,30.34z M12.04,18.22
              c2.71,0,4.93-2.21,4.93-4.91c0-2.69-2.2-4.89-4.9-4.91c-2.68-0.02-4.93,2.22-4.93,4.92C7.14,16.01,9.35,18.22,12.04,18.22z"
          />
        </g>
      </g>
    </svg>
  );
};

export default LocationIcon;
