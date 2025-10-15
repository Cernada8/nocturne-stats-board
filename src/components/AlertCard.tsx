import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface AlertCardProps {
  id: string;
  name: string;
  onClick: (id: string) => void;
  isActive: boolean;
}

const AlertCard = ({ id, name, onClick, isActive }: AlertCardProps) => {
  return (
    <Card 
      className={`glass-card p-6 cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'bg-primary/15 !border-cyan-300/60 shadow-xl shadow-cyan-400/30 scale-105' 
          : 'hover:bg-white/10 hover:scale-[1.02]'
      }`}
      onClick={() => onClick(id)}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl transition-all duration-300 ${
          isActive ? 'bg-primary/30 scale-110' : 'bg-accent/20'
        }`}>
          <BookOpen className={`w-5 h-5 transition-colors duration-300 ${
            isActive ? 'text-primary-foreground' : 'text-accent-foreground'
          }`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{name}</p>
        </div>
      </div>
    </Card>
  );
};

export default AlertCard;