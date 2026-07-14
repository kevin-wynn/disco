import { SpeakerWave } from "./Icons/SpeakerWave";

export const Logo = () => (
  <a
    href="/"
    aria-label="Go to My Library"
    className="font-black italic text-5xl mb-14 tracking-tighter flex align-middle duration-200 hover:text-green-600 hover:cursor-pointer"
  >
    <span>DISCO</span>
    <span className="ml-2">
      <SpeakerWave />
    </span>
  </a>
);
