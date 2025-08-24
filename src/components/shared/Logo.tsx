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
      <path
        d="M6.66663 16L2.66663 18.3125V13.6875L6.66663 16Z"
        fill="currentColor"
      />
      <path
        d="M16 4L2.66663 11.5V20.5L16 28L29.3333 20.5V11.5L16 4Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.3334 16L29.3334 18.3125V13.6875L25.3334 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
