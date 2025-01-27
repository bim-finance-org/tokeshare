import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/NavBar";

const page = () => {
  return (
    <div className="bg-color4">
      <Navbar />
      <div className="text-justify px-6 sm:px-20 py-20">
        <h1 className=" text-3xl md:text-4xl pb-10 flex justify-center items-center">Terms of Service - Tokeshare</h1>

        <h2>Effective Date: 27/01/2025</h2>
        <div className="pb-4">Please read these Terms of Use (“Terms”) carefully. They govern your access to and use of the Tokeshare website, platform, and mobile application (“Sites”). By accessing or using our services, you agree to these Terms in full. If you do not agree to these Terms, please do not use our services.</div>
        <div className="pb-4">
          <p>
            By accessing the Sites, you confirm that: <br />
          </p>
          <ul className="pl-4">
            <li>(a) You have read, understood, and accepted these Terms,</li>
            <li>(b) You have the legal age required to enter into a binding contract, and</li>
            <li>(c) You are authorized to use Tokeshare&apos;s services.</li>
          </ul>
        </div>

        <h2>1. Tokenization Services and Offerings</h2>
        <p className="pb-4">Tokeshare provides a platform that offers investment opportunities through the tokenization of real estate assets and raw materials. Each investment is governed by specific conditions, and it is your responsibility to read and understand the associated offering documents before investing.</p>

        <h2>2. Legal Compliance</h2>
        <p className="pb-4">Using our Sites in violation of applicable laws is strictly prohibited. You are solely responsible for ensuring that your use of Tokeshare&apos;s services complies with the regulations in your jurisdiction.</p>

        <h2>3. No Financial Advice</h2>
        <p className="pb-4">Tokeshare does not provide legal, tax, or financial advice. The information presented on our Sites does not constitute a recommendation to buy or sell assets.</p>

        <h2>4. Account Creation and Privacy</h2>
        <p className="pb-4">To access the services, you must create an account and provide accurate and complete information. You are responsible for the security of your login credentials and any activity conducted under your account.</p>

        <h2>5. Intellectual Property</h2>
        <p className="pb-4">All content and materials on our Sites are the property of Tokeshare or its licensors and are protected by applicable intellectual property laws.</p>

        <h2>6. Acceptable Use</h2>
        <p className="pb-4">You agree not to use our Sites for illegal, fraudulent, or harmful purposes, including introducing malware or any form of hacking.</p>

        <h2>7. Data Protection</h2>
        <p className="pb-4">Tokeshare implements measures to protect your personal data in accordance with our privacy policy. We may retain your data for as long as necessary to fulfill our legal and contractual obligations.</p>

        <h2>8. Limitation of Liability</h2>
        <p className="pb-4">Tokeshare shall not be held liable for any losses related to the use of its services, including but not limited to technical failures, data loss, or human errors.</p>

        <h2>9. Changes to the Terms</h2>
        <p className="pb-4">We reserve the right to modify these Terms at any time. Any changes will be published on our Sites and will take effect immediately upon publication.</p>

        <h2>10. Contact</h2>
        <p className="pb-4">
          For any questions or information requests, please contact us at: <br />
          Email: contact@tokeshare.co
        </p>

        <p className="pb-4">By using our services, you accept these Terms and acknowledge that you have reviewed our policies and obligations.</p>
      </div>
      <Footer />
    </div>
  );
};

export default page;
