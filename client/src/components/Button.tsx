import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-gold text-ink hover:bg-amber-300",
    secondary: "border border-white/15 bg-white/5 text-white hover:bg-white/10",
    danger: "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  };
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
