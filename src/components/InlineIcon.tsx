interface InlineIconProps {
  name: "globe" | "x" | "clock" | "spark" | "refresh" | "external";
  className?: string;
}

export function InlineIcon({ name, className = "h-5 w-5" }: InlineIconProps) {
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...common}>
      {name === "globe" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 0 20" />
          <path d="M12 2a15.3 15.3 0 0 0 0 20" />
        </>
      )}
      {name === "x" && (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </>
      )}
      {name === "spark" && (
        <>
          <path d="M12 2v5" />
          <path d="M12 17v5" />
          <path d="m4.93 4.93 3.54 3.54" />
          <path d="m15.54 15.54 3.53 3.53" />
          <path d="M2 12h5" />
          <path d="M17 12h5" />
          <path d="m4.93 19.07 3.54-3.53" />
          <path d="m15.54 8.46 3.53-3.53" />
        </>
      )}
      {name === "refresh" && (
        <>
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </>
      )}
      {name === "external" && (
        <>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </>
      )}
    </svg>
  );
}
