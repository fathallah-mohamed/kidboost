import { Sparkles } from "lucide-react";

interface MascotProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Mascot = ({ size = "md", className = "" }: MascotProps) => {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div className={`${sizes[size]} ${className} relative animate-float`}>
      <div className="w-full h-full bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
        <Sparkles className="w-1/2 h-1/2 text-white" />
      </div>
      {/* Little sparkle effect */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-pastel-yellow rounded-full animate-pulse" />
    </div>
  );
};
