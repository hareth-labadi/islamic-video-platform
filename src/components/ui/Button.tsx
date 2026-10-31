import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "accent" | "ink" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  accent: "bg-accent text-ink hover:bg-[#f5bf55]",
  ink: "bg-ink text-white hover:bg-ink-soft",
  outline: "border-[1.5px] border-current bg-transparent hover:bg-ink hover:text-white hover:border-ink",
  ghost: "bg-transparent hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-6 text-[15px] gap-2.5",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function buttonClasses({ variant = "outline", size = "md", className }: Omit<CommonProps, "children" | "icon">) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-bold whitespace-nowrap transition-colors duration-200",
    variants[variant],
    sizes[size],
    className,
  );
}

/** Pill button. Renders a <Link> when `href` is given, otherwise a <button>. */
export function Button(
  props: CommonProps &
    (({ href: string } & Omit<ComponentProps<typeof Link>, "className" | "children">) |
      ({ href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">)),
) {
  const { variant, size, icon, className, children, ...rest } = props;
  const classes = buttonClasses({ variant, size, className });

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as ComponentProps<typeof Link>)} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type="button" {...(rest as ComponentProps<"button">)} className={classes}>
      {icon}
      {children}
    </button>
  );
}
