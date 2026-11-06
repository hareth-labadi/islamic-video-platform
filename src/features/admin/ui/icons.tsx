import type { SVGProps } from "react";

/*
 * Admin-only icons, drawn like src/components/ui/icons.tsx (24 grid, 2.2 stroke,
 * round caps). Shared icons (play, search, close…) come from that file.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function line({ size = 20, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export const GridIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="3.5" />
  </svg>
);

export const FilmIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m10 9.5 4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const LayersIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z" />
    <path d="m3.5 12 8.5 4.5 8.5-4.5" />
    <path d="m3.5 16 8.5 4.5 8.5-4.5" />
  </svg>
);

export const BoltIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="6" y="2.5" width="12" height="19" rx="3" />
    <path d="m12.5 7-2.5 5h4l-2.5 5" />
  </svg>
);

export const InboxIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M4 13.5 6.2 5.6A2 2 0 0 1 8.1 4h7.8a2 2 0 0 1 1.9 1.6L20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M4 13.5h4.5l1 2h5l1-2H20" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.9.8 3.1 2.6 3.5 5.2" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-4 3.8-6.5 7.5-6.5s6.7 2.5 7.5 6.5" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M4.5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
  </svg>
);

export const GripIcon = (p: IconProps) => (
  <svg {...line(p)} fill="currentColor" stroke="none">
    {[6, 12, 18].map((y) => (
      <g key={y}>
        <circle cx="9" cy={y} r="1.6" />
        <circle cx="15" cy={y} r="1.6" />
      </g>
    ))}
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M10 5.8c.6-.2 1.3-.3 2-.3 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.4 7.4C3.9 9.1 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.5 4.3-1.2" />
    <path d="m3.5 3.5 17 17" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" />
    <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M13.5 4.5h6v6M19.5 4.5 11 13" />
    <path d="M17.5 14v3.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2H10" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <circle cx="12" cy="16.3" r="0.6" fill="currentColor" />
  </svg>
);

export const ImageIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m4 17.5 5-4.5 4 3.5 2.5-2 4.5 3.5" />
  </svg>
);

export const RefreshIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const DotsIcon = (p: IconProps) => (
  <svg {...line(p)} fill="currentColor" stroke="none">
    <circle cx="6" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="18" cy="12" r="1.8" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const ChevronIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const StopIcon = (p: IconProps) => (
  <svg {...line(p)} fill="currentColor" stroke="none">
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
  </svg>
);

export const SpinnerIcon = (p: IconProps) => (
  <svg {...line(p)} className={`animate-spin ${p.className ?? ""}`}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </svg>
);

export const XCircleIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const TagIcon = (p: IconProps) => (
  <svg {...line(p)}>
    <path d="M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6l8 8a1.5 1.5 0 0 1 0 2.1l-6.5 6.5a1.5 1.5 0 0 1-2.1 0z" />
    <circle cx="8.5" cy="8.5" r="1.5" />
  </svg>
);
