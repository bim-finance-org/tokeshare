import React from "react";
import Image from "next/image";
import ArrowLineIcon from "./icons/ArrowLineIcon";

const steps = [
  { src: "/images/schema/step-1.png", label: "TENANT" },
  { src: "/images/schema/step-2.png", label: "PAYROLL / USD\nEURO / DOP\nARS" },
  { src: "/images/schema/step-3.png", label: "MANAGEMENT" },
  { src: "/images/schema/step-4.png", label: "SENDS USDC TOKEN" },
  { src: "/images/schema/step-5.png", label: "TOKESHARE OWNERS" },
  { src: "/images/schema/step-6.png", label: "TO BANK ACCOUNT" },
];

const Schema = () => {
  return (
    <div className="relative w-4/5 bg-color1 py-10 mx-auto rounded-3xl shadow-lg mt-[-10rem]">
      <h2 className="text-lg sm:text-lg md:text-3xl lg:text-4xl font-bold text-black md:ml-20 mb-8 text-center">Rent payments are automatically sent to investors</h2>

      <div className="hidden sm:flex justify-center items-center mb-8">
        <Image src="/images/schema/schema.png" alt="Rent payments schema" width={800} height={400} quality={90} loading="lazy" />
      </div>

      <div className="flex flex-col sm:hidden justify-center items-center ">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            {/* Image de l'étape */}
            <Image src={step.src} alt={step.label} width={80} height={40} quality={90} loading="lazy" />
            <h2 className="text-color2 mt-2 whitespace-pre-line">{step.label}</h2>

            {index < steps.length - 1 && <ArrowLineIcon size={64} className="text-color3 rotate-90 my-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Schema;
