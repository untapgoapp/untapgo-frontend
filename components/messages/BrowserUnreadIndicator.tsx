"use client";

import { useEffect, useRef } from "react";

const TITLE_PREFIX = /^\(\d+\)\s+/;
const INDICATOR_ID = "untapgo-message-favicon";

function cleanTitle(value: string): string {
  return value.replace(TITLE_PREFIX, "") || "UntapGo";
}

function installUnreadFavicon(): () => void {
  removeUnreadFavicon();
  let cancelled = false;

  const image = new Image();
  image.src = "/icon.png";
  image.onload = () => {
    if (cancelled) return;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0, 64, 64);
    context.beginPath();
    context.arc(52, 12, 10, 0, Math.PI * 2);
    context.fillStyle = "#6E5AA7";
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = "#FFFFFF";
    context.stroke();

    const link = document.createElement("link");
    link.id = INDICATOR_ID;
    link.rel = "icon";
    link.type = "image/png";
    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
  };

  return () => {
    cancelled = true;
    removeUnreadFavicon();
  };
}

function removeUnreadFavicon() {
  document.getElementById(INDICATOR_ID)?.remove();
}

export default function BrowserUnreadIndicator({ unreadCount }: { unreadCount: number }) {
  const baseTitleRef = useRef("UntapGo");
  const unreadRef = useRef(unreadCount);

  useEffect(() => {
    unreadRef.current = unreadCount;

    const applyTitle = () => {
      const currentBase = cleanTitle(document.title);
      if (currentBase !== baseTitleRef.current) baseTitleRef.current = currentBase;
      const desired = unreadRef.current > 0
        ? `(${unreadRef.current}) ${baseTitleRef.current}`
        : baseTitleRef.current;
      if (document.title !== desired) document.title = desired;
    };

    const frame = requestAnimationFrame(applyTitle);
    const titleNode = document.querySelector("title");
    const observer = new MutationObserver(applyTitle);
    observer.observe(titleNode ?? document.head, { childList: true, subtree: true });

    const cleanupFavicon = unreadCount > 0
      ? installUnreadFavicon()
      : () => removeUnreadFavicon();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanupFavicon();
    };
  }, [unreadCount]);

  useEffect(() => () => {
    document.title = cleanTitle(document.title);
    removeUnreadFavicon();
  }, []);

  return null;
}
