"use client";

import { useState } from "react";

const COOKIE_NAME = "theme-preference-hint";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function setThemeCookie(value: "CLASSICO" | "GAMIFICADO") {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function ThemePreferenceToggle({
  defaultValue,
}: {
  defaultValue: "CLASSICO" | "GAMIFICADO";
}) {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div className="grid grid-cols-2 gap-2">
      <label
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors ${
          selected === "CLASSICO"
            ? "border-primary bg-accent"
            : "hover:bg-accent"
        }`}
      >
        <input
          type="radio"
          name="themePreferenceHint"
          value="CLASSICO"
          checked={selected === "CLASSICO"}
          onChange={() => {
            setSelected("CLASSICO");
            setThemeCookie("CLASSICO");
          }}
          className="sr-only"
        />
        <span className="font-medium">Clássico</span>
        <span className="text-muted-foreground">Visual neutro</span>
      </label>

      <label
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors ${
          selected === "GAMIFICADO"
            ? "border-primary bg-accent"
            : "hover:bg-accent"
        }`}
      >
        <input
          type="radio"
          name="themePreferenceHint"
          value="GAMIFICADO"
          checked={selected === "GAMIFICADO"}
          onChange={() => {
            setSelected("GAMIFICADO");
            setThemeCookie("GAMIFICADO");
          }}
          className="sr-only"
        />
        <span className="font-medium">🎮 Gamificado</span>
        <span className="text-muted-foreground">XP, streaks, badges</span>
      </label>
    </div>
  );
}
