import { useState, type ReactNode } from "react";
import { NavBar } from "./NavBar";

export const Wrapper = ({
  children,
  currentPage,
}: {
  children: ReactNode;
  currentPage: string;
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col md:flex-row min-h-screen p-4 md:p-10 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar / Mobile Menu */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-full md:h-auto z-50
          w-64 md:w-1/4 lg:w-1/5
          bg-white dark:bg-black
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          p-4 md:p-0
          overflow-y-auto
        `}
      >
        <div className="flex md:hidden justify-end mb-4">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <NavBar currentPage={currentPage} onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="w-full md:w-3/4 lg:w-4/5 md:pl-6">{children}</div>
    </div>
  );
};
