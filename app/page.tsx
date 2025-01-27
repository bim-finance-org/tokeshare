import React from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import PopularHouses from "./components/PopularHouses";
import ArrowLineIcon from "./components/icons/ArrowLineIcon";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../components/ui/input";
import Schema from "./components/Schema";

export default function Home() {
  return (
    <>
      <div className="relative h-screen bg-color1">
        <NavBar customClass="absolute top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50" />
        <div className="relative h-screen">
          <Image src="/images/bg-image-1.webp" alt="House" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-36 space-y-4">
          <h1 className="text-white text-4xl md:text-6xl pt-4 w-full md:w-2/3 lg:w-1/2">Let&apos;s redefine access to investment</h1>
          <p className="text-white text-sm md:text-lg max-w-lg leading-relaxed text-justify">Through Tokeshare, investors from around the world can now enter the Latin American market through fractionalized and tokenized ownership. With transparency and the efficiency of blockchain, we offer a compliant and modern solution to rethink real estate investment.</p>
          <p className="text-white text-sm md:text-lg">The future of finance lies in tokenization.</p>
          <Link href="/buildingInProgress">
            <button className="rounded-lg w-48 bg-color4 px-6 py-2 text-sm md:text-lg hover:scale-105 transition-transform duration-300">Sign up</button>
          </Link>
        </div>
      </div>

      <Schema />

      <PopularHouses indexes={[0, 1, 2]} />

      <div className="mt-16 bg-color4 p-8">
        <div className="h-72"></div>
        <h4 className="font-bold text-5xl text-center mb-6">Interested in Updates?</h4>

        <div className="relative w-full my-8">
          <div className="border-t-2 border-color1 w-full"></div>
          <div className="absolute left-1/3 transform -translate-x-1/2 -top-3 bg-color4 px-4">
            <span>Email Address </span>
            <span className="text-color3">*</span>
          </div>
        </div>

        <form className="flex flex-col items-center space-y-6">
          <Input type="text" placeholder="Your email here" className="w-3/5 p-3 bg-transparent border border-color1" required />
          <div className="relative w-full my-8">
            <div className="border-t-2 border-color1 w-full"></div>
            <div className="absolute left-2/3 transform -translate-x-1/2 -top-3 bg-color4 px-2">
              <span className="text-color3">* </span>
              <span>Required</span>
            </div>
          </div>

          <button type="submit" className="flex items-center justify-center py-4 px-8 bg-color5 text-color4 rounded-full text-lg font-medium hover:bg-color2 transition">
            <h2 className="pl-10 pr-4 text-3xl">Subscribe</h2>
            <ArrowLineIcon size={72} />
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}
