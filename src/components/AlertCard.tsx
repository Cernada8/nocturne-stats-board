import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';

interface AlertCardProps {
  id: string;
  name: string;
  onClick: (id: string) => void;
  isActive: boolean;
}

const AlertCard = ({ id, name, onClick, isActive }: AlertCardProps) => {
  return (
    <Card 
      className={`glass-card p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] ${
        isActive ? 'ring-2 ring-primary bg-white/10' : ''
      }`}
      onClick={() => onClick(id)}
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-accent/20 rounded-xl">
          <Bell className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{name}</p>
        </div>
      </div>
    </Card>
  );
};

export default AlertCard;
