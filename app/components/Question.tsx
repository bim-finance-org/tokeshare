"use client";

import React, { useState } from "react";

interface QuestionProps {
  question: string;
  answer: string;
}

const Question: React.FC<QuestionProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAnswer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="px-4 md:px-8 py-4">
      <div className="border border-color1 py-4 rounded-lg px-8">
        <div className="flex items-center justify-between cursor-pointer" onClick={toggleAnswer}>
          <p className="text-color1">{question}</p>
          <img src="/icons/shortArrowIcon.png" alt="Arrow Icon" className={`mr-8 h-8 w-8 object-contain transform ${isOpen ? "rotate-90" : ""}`} />
        </div>
        {isOpen && <p className="mt-2 text-gray-600">{answer}</p>}
      </div>
    </div>
  );
};

export default Question;
