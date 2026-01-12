import type { ReactNode } from "react";
import { MusicNote } from "./Icons/MusicNote";
import { PlusCircle } from "./Icons/PlusCircle";
import { Cog6Tooth } from "./Icons/Cog6Tooth";
import { Logo } from "./Logo";
import { AdjustmentsHorizontal } from "./Icons/AdjustmentsHorizontal";
import { User } from "./Icons/User";

const NavItem = ({
  children,
  icon,
  url,
  currentPage,
}: {
  children: ReactNode;
  icon: ReactNode;
  url: string;
  currentPage: string;
}) => {
  return (
    <li className="flex mb-12">
      <a
        href={url}
        className={`flex duration-200 hover:text-green-600 hover:cursor-pointer ${
          currentPage === url && "text-green-600"
        }`}
      >
        <div className="mr-2">{icon}</div>
        <div className="font-bold">{children}</div>
      </a>
    </li>
  );
};

export const NavBar = ({ currentPage }: { currentPage: string }) => {
  return (
    <nav className="">
      <Logo />
      <ul>
        <NavItem currentPage={currentPage} url="/" icon={<MusicNote />}>
          My Library
        </NavItem>
        <NavItem
          currentPage={currentPage}
          url="/genres"
          icon={<AdjustmentsHorizontal />}
        >
          Genres
        </NavItem>
        <NavItem currentPage={currentPage} url="/artists" icon={<User />}>
          Artists
        </NavItem>
        <NavItem currentPage={currentPage} url="/add" icon={<PlusCircle />}>
          Add New
        </NavItem>
        <NavItem currentPage={currentPage} url="/settings" icon={<Cog6Tooth />}>
          Settings
        </NavItem>
      </ul>
    </nav>
  );
};
