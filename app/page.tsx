"use client";
import React, { useState } from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import PopularHouses from "./components/PopularHouses";
import ArrowLineIcon from "./components/icons/ArrowLineIcon";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../components/ui/input";
import Schema from "./components/Schema";
import { z } from "zod";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubscribe = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!z.string().email().safeParse(email).success) {
      setError("Invalid email address. Please enter a valid one.");
      return;
    }

    try {
      setIsSubmitting(true);
      const body = { email };
      const response = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status < 200 || response.status >= 400) {
        throw new Error();
      }
      setSubmitted(true);
      setEmail(""); // Réinitialisation du champ après soumission
      setError(""); // Supprimer les erreurs après succès
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      console.error("Erreur d'inscription:", error);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <>
      <div className="relative h-screen bg-color1">
        <NavBar customClass="absolute top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50" />
        <div className="relative h-screen">
          <Image src="/images/bg-image-1.webp" alt="House" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-36 space-y-4">
          <h1 className="text-white text-4xl md:text-6xl pt-48 md:pt-4 w-full md:w-2/3 lg:w-1/2">Let&apos;s redefine access to investment</h1>
          <p className="text-white text-sm md:text-lg max-w-lg leading-relaxed text-justify">Through Tokeshare, investors from around the world can now enter the Latin American market through fractionalized and tokenized ownership. With transparency and the efficiency of blockchain, we offer a compliant and modern solution to rethink real estate investment.</p>
          <p className="text-white text-sm md:text-lg">The future of finance lies in tokenization.</p>
          <Link href="/buildingInProgress">
            <button className="rounded-lg w-48 bg-color4 px-6 py-2 text-sm md:text-lg hover:scale-105 transition-transform duration-300">Sign up</button>
          </Link>
        </div>
      </div>

      <Schema />

      <PopularHouses />

      <div className="mt-16 bg-color4 p-8">
        <div className="h-72"></div>
        <h4 className="font-bold text-5xl text-center mb-6">Interested in Updates?</h4>

        {submitted ? (
          <p className="text-green-400 font-semibold text-center">✅ Thank you! We’ll keep you updated. Stay tuned! 🎉</p>
        ) : (
          <>
            <div className="relative w-full my-8">
              <div className="border-t-2 border-color1 w-full"></div>
              <div className="absolute left-1/3 transform -translate-x-1/2 -top-3 bg-color4 px-4">
                <span>Email Address </span>
                <span className="text-color3">*</span>
              </div>
            </div>
            <form className="flex flex-col items-center space-y-6">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(""); // Supprime l'erreur en cas de modification
                }}
                className={`w-3/5 p-3 bg-transparent border ${error ? "border-red-500" : "border-color1"}`}
                disabled={isSubmitting}
              />
              <div className="relative w-full my-8">
                <div className="border-t-2 border-color1 w-full"></div>
                <div className="absolute left-2/3 transform -translate-x-1/2 -top-3 bg-color4 px-2">
                  <span className="text-color3">* </span>
                  <span>Required</span>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button className="flex items-center justify-center py-4 px-8 bg-color5 text-color4 rounded-full text-lg font-medium hover:bg-color2 transition disabled:bg-gray-600" onClick={handleSubscribe} disabled={!email.trim() || !z.string().email().safeParse(email).success || isSubmitting}>
                <h2 className="pl-10 pr-4 text-3xl">Subscribe</h2>
                <ArrowLineIcon size={72} />
              </button>
            </form>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
