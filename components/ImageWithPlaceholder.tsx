import React, { useEffect, useState } from "react";

interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  alt,
  className = "",
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div className={`relative inline-block ${className}`} onClick={onClick}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg" />
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`
          w-auto h-auto
          max-w-[300px]    
          max-h-[300px]   
          object-contain  
          transition-opacity duration-500
          ${isLoaded ? "opacity-100" : "opacity-0"}
        `}
      />
    </div>
  );
};
