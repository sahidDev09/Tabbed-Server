export default function Footer() {
  return (
    <footer className="container mx-auto p-8">
      <hr className="my-6" />

      {/* Bottom Section */}
      <div className="flex flex-col md:flex-row justify-between items-center text-sm">
        <p>&copy; {new Date().getFullYear()} Tabbed.io. All Rights Reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="/terms" className="hover:text-gray-400">
            Terms of Service
          </a>
          <a href="/privacy" className="hover:text-gray-400">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
