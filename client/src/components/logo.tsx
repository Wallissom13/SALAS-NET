import React from "react";

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
};

export const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: "h-8 w-8 text-lg",
    medium: "h-10 w-10 text-xl",
    large: "h-20 w-20 text-3xl",
  };

  return (
    <div className={`${sizeClasses[size]} bg-primary rounded-full flex items-center justify-center`}>
      <span className="text-white font-bold">CEPI</span>
    </div>
  );
};
