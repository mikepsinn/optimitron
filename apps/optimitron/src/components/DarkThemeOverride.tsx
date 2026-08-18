"use client";

import { useEffect } from "react";

export function DarkThemeOverride() {
  useEffect(() => {
    const html = document.documentElement;
    const hadDarkClass = html.classList.contains("dark");
    const hadLightClass = html.classList.contains("light");

    html.classList.add("dark");
    html.classList.remove("light");

    return () => {
      html.classList.toggle("dark", hadDarkClass);
      html.classList.toggle("light", hadLightClass);
    };
  }, []);

  return null;
}
