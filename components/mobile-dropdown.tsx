"use client";

import Link from "next/link";
import HeaderAuth from "@/components/header-auth";
import React from "react";

type MobileMenuProps = {
  isOpen: boolean; // `isOpen` should be a boolean
  onClose: () => void; // `onClose` is a function with no arguments and no return value
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null; // If not open, don't render anything.

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Close button row */}
      <div className="w-full px-4 py-2 flex items-center justify-end">
        <button
          className="block mr-2"
          onClick={onClose}
          aria-label="Close menu"
        >
          X
        </button>
      </div>

      <hr className="border-gray-700" />

      <div className="px-4 py-4 flex-1 overflow-auto">
        {/* Navigation links, each closes the menu when clicked */}
        <div className="text-xl divide-y divide-gray-700">
          <Link href="/" onClick={onClose} className="block py-3">
            Protocol
          </Link>
          <Link href="/product" onClick={onClose} className="block py-3">
            Product
          </Link>
          <Link href="/pricing" onClick={onClose} className="block py-3">
            Pricing
          </Link>
        </div>

        <div className="mt-8">
          <HeaderAuth onActionClick={onClose} />
        </div>
      </div>
    </div>
  );
}
