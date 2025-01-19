"use client";

import React from "react";

interface QuestionProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const Question: React.FC<QuestionProps> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="px-4 md:px-8 py-4">
      <div className="border border-color1 py-4 rounded-lg px-8">
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <p className="text-color1">{question}</p>
          <img src={isOpen ? "/icons/crossIcon.webp" : "/icons/shortArrowIcon.png"} alt={isOpen ? "Close Icon" : "Arrow Icon"} className="mr-8 h-8 w-8 object-contain transform" />
        </div>
        {isOpen && <p className="mt-2 text-gray-600">{answer}</p>}
      </div>
    </div>
  );
};

export default Question;
