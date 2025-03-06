import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center justify-between space-x-10">
          {/* Logo */}
          <Link
            href="/"
            className="font-extrabold text-2xl tracking-tight text-black"
          >
            Tabbed<span className="text-gray-500">.io</span>
          </Link>

          {/* Navigation */}
          {/* <nav className="flex space-x-4">
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Pricing
            </Link>
            <Link
              href="/services"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Services
            </Link>
          </nav> */}
        </div>

        {/* Registration */}
        <div className="flex space-x-2">
          <Link href="/sign-in">
            <Button variant={"outline"}>Sign In</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
