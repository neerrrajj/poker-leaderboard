
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Trash2, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Session, formatCurrency, formatDate, pokerDB } from '@/lib/data';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onDelete }) => {
  const navigate = useNavigate();
  
  const totalBuyIn = session.players.reduce((sum, player) => sum + player.buyIn, 0);
  const totalCashOut = session.players.reduce((sum, player) => sum + (player.cashOut || 0), 0);
  
  const handleDelete = () => {
    if (pokerDB.deleteSession(session.id)) {
      onDelete(session.id);
      toast.success(`Session deleted successfully`);
    }
  };
  
  const viewSessionDetails = () => {
    navigate(`/sessions/${session.id}`);
  };
  
  // Get number of winners (cashOut > buyIn)
  const getWinners = () => {
    if (session.isActive) return [];
    
    return session.players.filter(player => 
      player.cashOut !== null && player.cashOut > player.buyIn
    );
  };
  
  const winners = getWinners();
  
  return (
    <Card className="glass-card card-hover w-full animate-fade-in overflow-hidden">
      <CardHeader className="pb-2 flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">{formatDate(session.date)}</CardTitle>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the session from {formatDate(session.date)} at {session.location}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardDescription>{session.location}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Players</p>
            </div>
            <p className="text-xl font-medium">{session.players.length}</p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">Total Buy-in</p>
            <p className="text-xl font-medium">{formatCurrency(totalBuyIn)}</p>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              {session.isActive ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Completed
                </Badge>
              )}
              
              {!session.isActive && winners.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {winners.length} winner{winners.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={viewSessionDetails}
          >
            {session.isActive ? "Manage" : "View Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
