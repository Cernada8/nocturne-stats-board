import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

const StatsCard = ({ title, value, icon: Icon }: StatsCardProps) => {
  return (
    <Card className="glass-card p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] border-white/10">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-primary/20 rounded-2xl">
          <Icon className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-4xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
