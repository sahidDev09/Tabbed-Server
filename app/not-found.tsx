import Image from "next/image";
import Link from "next/link";
import React from "react";
import NotFoundImage from "@/public/errorImg.png";
import { Button } from "@/components/ui/button";

const notFount = () => {
  return (
    <section
      className="h-screen flex
    "
    >
      <div className="md:flex  items-center container mx-auto md:*:-mt-32">
        <div>
          <Image
            src={NotFoundImage}
            width={700}
            height={700}
            alt="error-page"
          />
        </div>
        <div className="flex flex-col gap-3 text-center md:text-start">
          <h1 className="md:text-6xl text-3xl font-black uppercase text-white">
            <span className=" text-red-500">404!</span> Page Not found
          </h1>
          <p className=" text-gray-400 text-lg">
            Please try again with actual route or refresh the page
          </p>

          <Link href="/">
            <Button variant="destructive" className="w-fit">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default notFount;
