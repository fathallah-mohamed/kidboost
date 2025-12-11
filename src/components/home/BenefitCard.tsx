import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  delay?: string;
  ariaLabel?: string;
}

export const BenefitCard = ({ icon: Icon, title, subtitle, delay = "0ms", ariaLabel }: BenefitCardProps) => {
  return (
    <Card 
      className="p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in bg-white/90 backdrop-blur-sm border-2 border-transparent hover:border-primary/20"
      style={{ animationDelay: delay }}
      role="article"
      aria-label={ariaLabel || title}
      itemProp="name"
    >
      <div className="mb-4 flex justify-center">
        <div className="p-3 rounded-full bg-primary/10" aria-hidden="true">
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed" itemProp="description">
        {subtitle}
      </p>
    </Card>
  );
};
