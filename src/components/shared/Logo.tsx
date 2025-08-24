import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="16" cy="16" r="4" fill="currentColor" />
      <path d="M16 4V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 28V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 16H10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 16H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8.2218 8.22168L12.4645 12.4644" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M23.7782 23.7783L19.5355 19.5355" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M8.2218 23.7783L12.4645 19.5355" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M23.7782 8.22168L19.5355 12.4644" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
