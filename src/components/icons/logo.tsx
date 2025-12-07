import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 25"
      width="160"
      height="25"
      {...props}
    >
      <text
        x="0"
        y="20"
        fontFamily="'Space Grotesk', sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
        className="text-foreground"
      >
        CareStint
      </text>
    </svg>
  );
}
