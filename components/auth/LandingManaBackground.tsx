import Image from "next/image";
import type { CSSProperties } from "react";

import styles from "./AuthLanding.module.css";

type ManaSymbol = {
  id: string;
  src: string;
  left: string;
  top: string;
  size: number;
  delay: string;
  duration: string;
  driftX: string;
  driftY: string;
  rotation: string;
  opacity: string;
  glow: string;
};

type ManaSymbolStyle = CSSProperties & {
  "--mana-delay": string;
  "--mana-duration": string;
  "--mana-drift-x": string;
  "--mana-drift-y": string;
  "--mana-rotation": string;
  "--mana-opacity": string;
  "--mana-glow": string;
};

const manaSymbols: ManaSymbol[] = [
  {
    id: "white",
    src: "/mana/w.svg",
    left: "12%",
    top: "20%",
    size: 112,
    delay: "-2s",
    duration: "10.5s",
    driftX: "42px",
    driftY: "-34px",
    rotation: "-10deg",
    opacity: "0.28",
    glow: "rgba(234, 198, 88, 0.25)",
  },
  {
    id: "blue",
    src: "/mana/u.svg",
    left: "84%",
    top: "21%",
    size: 104,
    delay: "-5s",
    duration: "12s",
    driftX: "-48px",
    driftY: "30px",
    rotation: "9deg",
    opacity: "0.3",
    glow: "rgba(76, 152, 255, 0.26)",
  },
  {
    id: "black",
    src: "/mana/b.svg",
    left: "11%",
    top: "75%",
    size: 96,
    delay: "-7s",
    duration: "13.5s",
    driftX: "50px",
    driftY: "-42px",
    rotation: "-7deg",
    opacity: "0.24",
    glow: "rgba(90, 72, 120, 0.23)",
  },
  {
    id: "red",
    src: "/mana/r.svg",
    left: "84%",
    top: "72%",
    size: 108,
    delay: "-4s",
    duration: "11.5s",
    driftX: "-45px",
    driftY: "-38px",
    rotation: "11deg",
    opacity: "0.28",
    glow: "rgba(239, 102, 79, 0.24)",
  },
  {
    id: "green",
    src: "/mana/g.svg",
    left: "52%",
    top: "13%",
    size: 142,
    delay: "-8s",
    duration: "14s",
    driftX: "34px",
    driftY: "44px",
    rotation: "-6deg",
    opacity: "0.23",
    glow: "rgba(66, 170, 103, 0.24)",
  },
];

export default function LandingManaBackground() {
  return (
    <div className={styles.manaField} aria-hidden="true">
      {manaSymbols.map((symbol) => {
        const style: ManaSymbolStyle = {
          left: symbol.left,
          top: symbol.top,
          width: symbol.size,
          height: symbol.size,
          "--mana-delay": symbol.delay,
          "--mana-duration": symbol.duration,
          "--mana-drift-x": symbol.driftX,
          "--mana-drift-y": symbol.driftY,
          "--mana-rotation": symbol.rotation,
          "--mana-opacity": symbol.opacity,
          "--mana-glow": symbol.glow,
        };

        return (
          <span key={symbol.id} className={styles.manaSymbol} style={style}>
            <span className={styles.manaHalo} />
            <Image
              src={symbol.src}
              width={symbol.size}
              height={symbol.size}
              alt=""
              priority={symbol.id === "green"}
            />
          </span>
        );
      })}
    </div>
  );
}
