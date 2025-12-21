import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 160, height = 40 }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="CareStint"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
