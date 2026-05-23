import Link from 'next/link';
import LinkedinIcon from '@/components/icons/social/LinkedinIcon';
import XIcon from '@/components/icons/social/XIcon';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="pt-12 bg-color4 text-white">
      <div className="flex flex-col md:flex-row justify-around items-start p-8 pb-12 w-4/5 mx-auto">
        <div className="mb-6 md:mb-0 relative w-[200px] h-[200px]">
          <Image src="/logos/shorts/logo_tokeshare-04.webp" alt="Logo Tokeshare" fill className="object-contain" />
        </div>

        <div className="mb-6 md:mb-0">
          <h1 className="text-xl font-bold text-color2 mb-4">INFORMATION</h1>
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">
              <Link href="/learn">FAQ</Link>
            </li>
            <li className="hover:underline cursor-pointer">
              <Link href="/blog">Blog</Link>
            </li>
            <li className="hover:underline cursor-pointer">
              <Link href="/terms-of-service">Terms of Service</Link>
            </li>
            <li className="hover:underline cursor-pointer">
              <Link href="/privacy-policy">Privacy Policy</Link>
            </li>
            <li className="hover:underline cursor-pointer">
              <Link href="/general-disclaimer">General Disclaimer</Link>
            </li>
          </ul>
        </div>

        <div>
          <h1 className="text-xl font-bold text-color2 mb-4">CONTACT US</h1>
          <p className="mb-8 text-lg">contact@tokeshare.co</p>
          <div className="flex space-x-4 text-2xl text-color2 mt-4">
            <Link href="https://x.com/Tokeshare" target="_blank">
              <XIcon size={56} className="hover:scale-105" />
            </Link>
            <Link href="https://www.linkedin.com/company/tokeshare/" target="_blank">
              <LinkedinIcon size={56} className="hover:scale-105" />
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-color3 text-xl text-center py-2">
        <p>© {new Date().getFullYear()} Tokeshare™. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
