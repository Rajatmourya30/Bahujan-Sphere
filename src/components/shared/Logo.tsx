import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FF8A00', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#E52E71', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" ry="24" fill="url(#logoGradient)" />
      <g transform="translate(25, 20) scale(0.6)">
        <path
          d="M56.2,27.9c-8.9-8.9-23.3-8.9-32.2,0c-8.9,8.9-8.9,23.3,0,32.2c8.9,8.9,23.3,8.9,32.2,0C65.1,51.2,65.1,36.8,56.2,27.9z M35,55.5c-3.5,0-6.8-1.4-9.2-3.8c-2-2-3.2-4.6-3.6-7.3c-0.3-2.3-0.1-4.7,0.7-6.9c1-2.9,2.8-5.3,5.2-7.1c2.9-2.2,6.5-3.3,10.2-2.9c3.3,0.3,6.4,1.8,8.8,4.2c2.4,2.4,3.8,5.5,4.2,8.8c0.3,3.6-0.7,7.2-2.9,10.2c-1.8,2.4-4.2,4.2-7.1,5.2C39.7,55.4,37.3,55.6,35,55.5z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M49.8,28.8c-2-2.7-4.6-4.8-7.6-6.1c-3.4-1.5-7.2-2-10.9-1.5c-3.4,0.5-6.6,2-9.2,4.4c-2.7,2.4-4.7,5.5-5.7,9c-1,3.2-1,6.6,0,9.9c0.9,3,2.6,5.7,4.9,7.9c2.7,2.5,6,4.1,9.6,4.5c3.6,0.4,7.2-0.2,10.4-1.8c3.1-1.5,5.7-3.8,7.6-6.7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
