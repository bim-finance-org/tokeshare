import React from "react";
import Footer from "../components/Footer";
import NavBar from "../components/NavBar";

const page = () => {
  return (
    <div className="bg-color4">
      <NavBar />
      <div className=" text-justify px-6 sm:px-20 py-20">
        <h1 className="text-3xl md:text-4xl flex justify-center items-center p-6 md:pb-12">General Disclaimer</h1>
        <p className="pb-4">The information presented on this website, as well as any additional analysis based on such presentations, is provided for the purpose of sharing limited information to parties interested in potentially investing in one or more offerings of Tokeshare, its subsidiaries, affiliates or associated entities, via the purchase of tokens in connection with such offerings.</p>
        <p className="pb-4">⚠️ This does not constitute an offer to sell financial securities. The information presented does not purport to include all the elements necessary to evaluate an investment. Any investment decision must be made on the basis of the official transactional documents, including the private placement memorandum and subscription agreement, which will be provided to you upon request.</p>
        <p className="pb-4">Neither Tokeshare, nor its subsidiaries, affiliates or related parties, nor its managers are brokers, dealers or underwriters of financial securities, and are not soliciting investors on behalf of any offering.</p>
        <p className="pb-4">
          No legal or financial advice <br />
          Tokeshare may provide data, information and content relating to investment opportunities via tokenization, however, such information should in no way be construed as legal, tax, insurance, financial or investment advice.
        </p>

        <p className="pb-4">
          Nothing contained on the Tokeshare website constitutes an offer to sell, a solicitation to buy, or a recommendation regarding any financial security, on the part of Tokeshare or any third party. <br />
          Nature of tokens offered <br />
          The tokens offered by Tokeshare are participations in the form of cryptographic digital tokens, compliant with EVM (Ethereum Virtual Machine) compatible blockchain standards, based on the ERC-20 standard, with transfer restrictions in compliance with applicable regulations.
        </p>
        <p className="pb-4">
          These tokens will be offered and sold only through a licensed broker, registered with the relevant regulatory authorities, and a member of the relevant regulatory bodies. <br />
          Investment restrictions and risks <br />
          The information available on this website is provided in the context of private placements offered in the form of digital tokens. This information must not be reproduced or used for any other purpose. <br />
          Tokeshare tokens have not been registered with the U.S. Securities and Exchange Commission (SEC) or any other governmental authority in the U.S. or elsewhere.
        </p>
        <p className="pb-4">No regulatory authority in the United States, Europe or elsewhere has approved or disapproved the tokens offered on this site. No guarantee is given as to the accuracy or relevance of the information contained on the site.</p>
        <p className="pb-4">
          High investment risk <br />
          Investing in cryptographic tokens such as Tokeshare tokens involves a high level of risk. You should only invest if you are prepared to lose your entire investment.
        </p>

        <p className="pb-4">To date, there is no public market for these tokens, and there is no guarantee that such a market will exist in the future.</p>

        <p className="pb-4">We encourage potential investors to consult their financial and legal advisors before making any investment decision.</p>
      </div>
      <Footer />
    </div>
  );
};

export default page;
