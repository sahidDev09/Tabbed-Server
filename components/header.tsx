"use client";

import Link from "next/link";
import React, { useState } from "react";
import HeaderAuth from "@/components/header-auth";
import MobileMenu from "@/components/mobile-dropdown";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="w-full px-4 py-2 flex items-center justify-end">
        <button
          className="block lg:hidden mr-2"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className="hidden lg:flex lg:space-x-4">
          <Link href="/">Protocol</Link>
          <Link href="/product">Product</Link>
          <Link href="/pricing">Pricing</Link>
        </div>

        <div className="hidden lg:block lg:ml-auto">
          <HeaderAuth />
        </div>
      </div>
      <hr />

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
