import { ProductCarousal } from "@/components/ProductCarousal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import HeroImage from "@/public/heroImage.png";

export default function Page() {
  return (
    <div className="container mx-auto p-4 flex flex-col">
      <section className="bg-white flex flex-col md:flex-row justify-center  space-y-10 md:space-y-0 md:space-x-20 py-20">
        <div className="flex-col mt-10">
          <div className="text-center md:text-left max-w-lg">
            {/* <p className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Move Fast and Break Things</p> */}
            {/* <p className="text-lg text-gray-700">The all-in-one collaboration platform designed for startups.</p>  */}
            {/* <p className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">The Everything App, For Startups</p> */}
            <p className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              The Everything App, For Startups
            </p>
            <p className="text-lg text-gray-700">
              Ditch enterprise bloatware, and ship faster.
            </p>
          </div>
          <div className="flex flex-col mt-10 space-y-2 md:flex-row md:space-x-1 md:space-y-0">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="px-8 py-5 text-lg border rounded-md"
            />
            <Button className="px-8 py-5 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200">
              Join Waitlist
            </Button>
          </div>
        </div>
        <div>
          <Image
            src={HeroImage}
            // src="/product/home.png"
            width={500}
            height={500}
            alt="Hero Image"
            className="rounded-lg shadow-lg"
          />
        </div>
      </section>
      {/* <section id="product" className="flex flex-col items-center justify-center p-10">
        <p>The Everything app, For Startups.</p>
        <p>Ditch corporate bloatware, and ship faster</p>
      </section> */}
      <section
        id="preview"
        className="flex flex-col items-center justify-center overflow-hidden"
      >
        <div className="w-full max-w-screen-lg">
          <ProductCarousal />
        </div>
      </section>
    </div>
  );
}
