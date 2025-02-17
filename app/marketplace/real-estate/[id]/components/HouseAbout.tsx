import React from "react";
import { House } from "@/app/types";

interface HouseAboutProps {
  house: House;
}

const HouseAbout: React.FC<HouseAboutProps> = ({ house }) => {
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto flex flex-col items-center sm:items-start text-color4">
      {/* Titre */}
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">ABOUT THE PROPERTY</h1>

      {/* Paragraphe */}
      <p className=" leading-10 h-96">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. In quos tempore quod mollitia illum odio facere adipisci. Molestias ipsam quia soluta eveniet, sapiente illo quidem eos fugit reprehenderit consequuntur perspiciatis exercitationem numquam neque, quisquam temporibus explicabo facere optio ab deleniti autem ipsa quas? Suscipit cum ullam, minima impedit incidunt deserunt, assumenda omnis maiores placeat pariatur non? Voluptatibus nam iste consectetur quos ad corrupti eaque
        laboriosam, id incidunt, rem possimus ut magni nesciunt unde nisi obcaecati reiciendis? Qui modi odio dolore explicabo cum nihil aut aliquid voluptates doloribus saepe? Corrupti temporibus a blanditiis atque repudiandae hic vel iure explicabo similique doloremque!
      </p>
    </div>
  );
};

export default HouseAbout;
