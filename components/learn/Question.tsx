"use client";

import React, { useState, useRef, useEffect } from "react";
import ArrowIcon from "../../components/icons/arrows/ArrowIcon";
import CrossIcon from "../../components/icons/CrossIcon";

interface QuestionProps {
  question: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

const Question: React.FC<QuestionProps> = ({ question, isOpen, onToggle, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | number>(0);

  useEffect(() => {
    if (isOpen) {
      setHeight(contentRef.current?.scrollHeight || 0);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className="px-4 md:px-8 py-4">
      <div className="border border-color1 py-4 rounded-lg px-2 md:px-8">
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <p className="text-color1 font-bold">{question}</p>
          {isOpen ? <CrossIcon size={24} className="transform flex-shrink-0" /> : <ArrowIcon size={24} className="transform flex-shrink-0" />}
        </div>
        <div ref={contentRef} style={{ maxHeight: height }} className={`overflow-hidden transition-max-height duration-300 ease-in-out mt-2 text-color1 md:pl-6 md:text-justify`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Question;
