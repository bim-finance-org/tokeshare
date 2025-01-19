"use client";

import React, { useState } from "react";
import faqData from "../data/faqData";
import Question from "../components/Question";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const Page = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="bg-color4">
      <NavBar />
      <h1 className="text-5xl font-bold mb-6 text-color1 flex justify-center pt-24">FAQ</h1>
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <Question key={index} question={faq.question} answer={faq.answer} isOpen={openIndex === index} onToggle={() => handleToggle(index)} />
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default Page;
