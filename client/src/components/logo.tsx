import React from "react";
import logoImage from "../assets/logo.png";

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
};

export const Logo: React.FC<LogoProps> = ({ size = 'medium', showAnimation = true }) => {
  const sizeClasses = {
    small: "h-10 w-10",
    medium: "h-16 w-16",
    large: "h-24 w-24",
  };

  const animationClass = showAnimation 
    ? "animate-float" 
    : "";

  return (
    <div className={`${animationClass} flex items-center justify-center`}>
      <img 
        src={logoImage} 
        alt="CEPI Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
    </div>
  );
};
