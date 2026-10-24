import Image from "next/image";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

const spritePosition: Record<string, [number, number]> = {
  accessibility: [0, 0],
  "arrow-left": [2, 0],
  bell: [3, 0],
  building: [5, 0],
  calendar: [6, 0],
  "microphone-accent": [7, 2],
  "check-circle": [0, 1],
  "chevron-right": [1, 1],
  exchange: [3, 1],
  eye: [4, 1],
  gift: [5, 1],
  home: [7, 1],
  "home-accent": [0, 2],
  "map-pin": [5, 2],
  lightbulb: [3, 2],
  more: [0, 3],
  scan: [3, 3],
  search: [4, 3],
  settings: [5, 3],
  "shield-check": [6, 3],
  sparkles: [0, 4],
  token: [2, 4],
  transfer: [3, 4],
  "transfer-accent": [4, 4],
  user: [5, 4],
  volume: [6, 4],
  "volume-accent": [7, 4],
  wallet: [0, 5],
  waveform: [1, 5],
};

export type SpriteName = keyof typeof spritePosition;

export function SpriteIcon({
  name,
  size = 24,
  className = "",
}: {
  name: SpriteName;
  size?: number;
  className?: string;
}) {
  const [column, row] = spritePosition[name];
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundPosition: `${-column * size}px ${-row * size}px`,
    backgroundSize: `${size * 8}px ${size * 6}px`,
  };

  return <span className={`ocbc-sprite ${className}`} style={style} aria-hidden="true" />;
}

export function IgniteImage({
  src,
  alt = "",
  className = "",
  width = 640,
  height = 640,
  fill = false,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  eager?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      {...(fill ? { fill: true, sizes: "(max-width: 390px) 100vw, 390px" } : { width, height })}
      className={className}
      unoptimized
      loading={eager ? "eager" : "lazy"}
    />
  );
}

export function SectionCard({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={`oc-section-card ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

export function OcbcButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
}) {
  return (
    <button className={`oc-button oc-button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function QuickAction({
  icon,
  iconSrc,
  label,
  onClick,
}: {
  icon?: SpriteName;
  iconSrc?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="oc-quick-action" type="button" onClick={onClick}>
      <span className="oc-quick-action-icon">
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconSrc} alt="" width={24} height={24} />
        ) : (
          <SpriteIcon name={icon!} size={24} />
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ContactRow({
  name,
  detail,
  onClick,
}: {
  name: string;
  detail: string;
  onClick: () => void;
}) {
  const initials = name
    .replace(/\s*·.*$/, "")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <button className="oc-contact-row" type="button" onClick={onClick}>
      <span className="oc-contact-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="oc-contact-copy">
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
      <SpriteIcon name="chevron-right" size={20} className="oc-contact-chevron" />
    </button>
  );
}

const navItems: { target: string; label: string; icon: SpriteName }[] = [
  { target: "home", label: "Home", icon: "home" },
  { target: "plan", label: "Plan", icon: "lightbulb" },
  { target: "pay", label: "Pay & Transfer", icon: "transfer" },
  { target: "rewards", label: "Rewards", icon: "gift" },
  { target: "more", label: "More", icon: "more" },
];

export function BottomNavigation({
  current,
  onNavigate,
}: {
  current: string;
  onNavigate: (target: string) => void;
}) {
  return (
    <nav className="oc-bottom-nav" aria-label="Primary">
      {navItems.map((item) => (
        <button
          className="oc-bottom-nav-item"
          key={item.target}
          type="button"
          aria-current={current === item.target ? "page" : undefined}
          onClick={() => onNavigate(item.target)}
        >
          {item.target === "pay" ? (
            <span className="oc-nav-circle"><SpriteIcon name={item.icon} size={24} /></span>
          ) : (
            <SpriteIcon name={item.icon} size={23} />
          )}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
