import React from "react";
import { FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-color4 text-white">
      <div className="flex flex-col md:flex-row justify-around items-start p-8 w-4/5 mx-auto">
        <div className="mb-6 md:mb-0">
          <img src="/logos/shorts/logo_tokeshare-04.png" alt="Logo Tokenshare" className="h-48" />
        </div>

        <div className="mb-6 md:mb-0">
          <h1 className="text-xl font-bold text-color2 mb-4">INFORMATION</h1>
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">FAQ</li>
            <li className="hover:underline cursor-pointer">Blog</li>
            <li className="hover:underline cursor-pointer">Terms of Service</li>
            <li className="hover:underline cursor-pointer">Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h1 className="text-xl font-bold text-color2 mb-4">CONTACT US</h1>
          <p className="mb-8 text-lg">contact@tokenshare.co</p>
          <div className="flex space-x-4 text-2xl text-color2 mt-4">
            <img src="/icons/instagramIcon.png" alt="Logo Instagram" className="w-14 h-14 object-contain" />
            <img src="/icons/twitterIcon.png" alt="Logo Twitter" className="w-14 h-14 object-contain" />
            <img src="/icons/linkedinIcon.png" alt="Logo Linkedin" className="w-14 h-14 object-contain" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
