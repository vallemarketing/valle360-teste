"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AILoaderProps {
  size?: number;
  text?: string;
  className?: string;
  inline?: boolean;
}

export const AILoader: React.FC<AILoaderProps> = ({ 
  size = 120, 
  text = "Gerando",
  className,
  inline = false
}) => {
  const letters = text.split("");

  if (inline) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full animate-spin border-2 border-transparent border-t-[#1672d6] border-r-[#1672d6]/50" />
        </div>
        <span className="text-sm text-[#001533]/70 dark:text-white/70 animate-pulse">
          {text}...
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center p-8",
      className
    )}>
      <div
        className="relative flex items-center justify-center font-medium select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-[#001533] dark:text-white opacity-40"
            style={{ 
              animation: `loaderLetter 2s infinite`,
              animationDelay: `${index * 0.1}s` 
            }}
          >
            {letter}
          </span>
        ))}

        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'loaderCircle 3s linear infinite',
            boxShadow: `
              0 4px 8px 0 #1672d6 inset,
              0 8px 12px 0 #1260b5 inset,
              0 24px 24px 0 #001533 inset,
              0 0 2px 1px rgba(22, 114, 214, 0.3),
              0 0 4px 1.5px rgba(22, 114, 214, 0.2)
            `
          }}
        />

        <style jsx>{`
          @keyframes loaderCircle {
            0% {
              transform: rotate(90deg);
            }
            50% {
              transform: rotate(270deg);
            }
            100% {
              transform: rotate(450deg);
            }
          }

          @keyframes loaderLetter {
            0%, 100% {
              opacity: 0.4;
              transform: translateY(0);
            }
            20% {
              opacity: 1;
              transform: scale(1.1);
            }
            40% {
              opacity: 0.7;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// Versão simplificada para uso em chat
export const AILoaderDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="w-2 h-2 rounded-full bg-[#1672d6] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#1672d6] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#1672d6] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default AILoader;
