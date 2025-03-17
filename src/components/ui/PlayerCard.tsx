
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Player, formatCurrency, pokerDB } from '@/lib/data';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PlayerCardProps {
  player: Player;
  onDelete: (id: string) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onDelete }) => {
  const navigate = useNavigate();
  const profit = player.totalCashOut - player.totalBuyIn;
  const isProfitable = profit >= 0;
  
  const handleDelete = () => {
    if (pokerDB.deletePlayer(player.id)) {
      onDelete(player.id);
      toast.success(`${player.name} has been removed`);
    }
  };
  
  const viewPlayerDetails = () => {
    navigate(`/players/${player.id}`);
  };
  
  return (
    <Card className="glass-card card-hover w-full animate-fade-in overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl text-balance">{player.name}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Sessions</p>
            <p className="text-xl font-medium">{player.sessionsPlayed}</p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Buy-ins</p>
            <p className="text-xl font-medium">{formatCurrency(player.totalBuyIn)}</p>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
            <div className="flex items-center mt-1">
              {isProfitable ? (
                <TrendingUp className="mr-2 h-4 w-4 text-poker-green" />
              ) : (
                <TrendingDown className="mr-2 h-4 w-4 text-poker-red" />
              )}
              <p 
                className={`text-xl font-semibold ${isProfitable ? 'text-poker-green' : 'text-poker-red'}`}
              >
                {formatCurrency(profit)}
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={viewPlayerDetails}
          >
            View Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
