import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

export const Wrapper = ({
  children,
  currentPage,
}: {
  children: ReactNode;
  currentPage: string;
}) => {
  return (
    <div className="w-full flex min-h-screen p-10 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="w-1/4 h-full">
        <NavBar currentPage={currentPage} />
      </div>
      <div className="w-3/4 h-full">{children}</div>
    </div>
  );
};
