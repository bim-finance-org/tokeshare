import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import PopularHouses from "./components/PopularHouses";

export default function Home() {
  return (
    <main className="bg-color1">
      <div className="relative h-screen">
        <NavBar customClass="absolute top-0 w-full flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4 z-50" />
        <img src="/images/bg-image-1.png" alt="Background" className="w-full h-full object-cover " />
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-36 space-y-4">
          <h1 className="text-white text-4xl md:text-6xl w-full md:w-2/3 lg:w-1/2">Let's redefine access to investment</h1>
          <p className="text-white font-textRegular text-sm md:text-lg max-w-lg leading-relaxed">Through Tokeshare, investors from around the world can now enter the Latin American market through fractionalized and tokenized ownership. With transparency and the efficiency of blockchain, we offer a compliant and modern solution to rethink real estate investment.</p>
          <p className="text-white font-text text-sm md:text-lg">The future of finance lies in tokenization.</p>
          <button className="rounded-lg w-48 bg-color4 px-6 py-2 text-sm md:text-lg hover:bg-color2 hover:text-white transition-colors duration-300">Sign up</button>
        </div>
      </div>

      <div className="relative w-4/5 bg-color1 py-10 mx-auto rounded-3xl shadow-lg mt-[-10rem]">
        <h2 className="text-2xl md:text-4xl font-bold text-black ml-20 mb-8 whitespace-nowrap ">Rent payments are automatically sent to investors</h2>
        <div className="flex justify-center items-center">
          <img src="/images/schema.png" alt="Rent payments schema" className="w-full max-w-5xl object-contain" />
        </div>
      </div>

      <PopularHouses indexes={[0, 1, 2]} />

      <div className="mt-16 bg-color4 p-8 ">
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
          <input type="email" placeholder=". . ." className="w-3/5 p-30 bg-transparent" required />
          <label htmlFor="email" className="absolute top-0 left-4 text-gray-400 text-sm mt-2"></label>

          <div className="relative w-full my-8">
            <div className="border-t-2 border-color1 w-full"></div>
            <div className="absolute left-2/3 transform -translate-x-1/2 -top-3 bg-color4 px-4">
              <span className="text-color3">* </span>
              <span>Required</span>
            </div>
          </div>

          <button type="submit" className="flex items-center justify-center w-1/5 px-8  bg-color5 text-color4 rounded-full text-lg font-medium hover:bg-color2 transition">
            <h1 className="pl-10 pr-4 text-3xl">Subscribe</h1>
            <img src="/icons/mediumArrowIcon.png" alt="" className="size-16 object-contain" />
          </button>
        </form>
      </div>

      <Footer />
    </main>
  );
}
