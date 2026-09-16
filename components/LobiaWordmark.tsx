type LobiaWordmarkProps = {
  className?: string;
  strokeWidth?: number;
};

export default function LobiaWordmark({
  className = "text-lg",
  strokeWidth = 1.5,
}: LobiaWordmarkProps) {
  return (
    <span
      className={`font-extrabold uppercase tracking-tight ${className}`}
    >
      <span
        style={{
          color: "#FFFFFF",
          WebkitTextStroke: `${strokeWidth}px var(--color-primary)`,
          paintOrder: "stroke fill",
          verticalAlign: "baseline",
        }}
      >
        LOB
      </span>
      <span
        style={{
          color: "var(--color-primary)",
          WebkitTextStroke: `${strokeWidth * 0.9}px #FFFFFF`,
          paintOrder: "stroke fill",
          fontSize: "0.93em",
          verticalAlign: "0.02em",
        }}
      >
        IA
      </span>
    </span>
  );
}
