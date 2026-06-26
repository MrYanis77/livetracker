import { useEffect, useState } from "react";
import clsx from "clsx";
import { applyTheme, getStoredTheme, type Theme } from "../hooks/useTheme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-secondary/60",
        "hover:bg-secondary transition-colors cursor-pointer text-xs font-medium",
        className
      )}
    >
      <span className="text-base leading-none" aria-hidden>
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="hidden sm:inline text-muted-foreground">
        {isDark ? "Clair" : "Sombre"}
      </span>
    </button>
  );
}
