
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, CalendarIcon, Plus, MinusCircle, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { pokerDB, Player, PlayerSession } from '@/lib/data';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";

interface AddSessionFormProps {
  onSessionAdded: () => void;
}

interface PlayerSessionInput extends PlayerSession {
  name: string;
}

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onSessionAdded }) => {
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [players, setPlayers] = useState<PlayerSessionInput[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  // const [players, setPlayers] = useState<Player[]>([]);
  // const [stats, setStats] = useState<ReturnType<typeof pokerDB.getOverallStats> extends Promise<infer T> ? T : never | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedPlayers] = await Promise.all([
          pokerDB.getPlayers(),
        ]);        
        setAvailablePlayers(fetchedPlayers);
      } catch (error) {
        console.error("Failed to load player data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open]);
  
  // useEffect(() => {
  //   setAvailablePlayers(pokerDB.getPlayers());
  // }, [open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast.error("Location is required");
      return;
    }
    
    if (players.length < 2) {
      toast.error("At least two players are required for a session");
      return;
    }
    
    if (players.some(p => p.buyIn <= 0)) {
      toast.error("All buy-ins must be greater than zero");
      return;
    }
    
    // Convert to PlayerSession format (remove names)
    const sessionPlayers: PlayerSession[] = players.map(({ playerId, buyIn, cashOut }) => ({
      playerId,
      buyIn,
      cashOut
    }));
    
    pokerDB.addSession({
      date,
      location,
      players: sessionPlayers,
    });
    
    toast.success(`New poker session added`);
    setDate(new Date());
    setLocation('');
    setPlayers([]);
    setSelectedPlayers([]);
    setOpen(false);
    onSessionAdded();
  };
  
  const togglePlayerSelection = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
      setPlayers(players.filter(p => p.playerId !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
      const player = availablePlayers.find(p => p.id === playerId);
      if (player) {
        setPlayers([...players, {
          playerId,
          name: player.name,
          buyIn: 0,
          cashOut: null
        }]);
      }
    }
  };
  
  const updatePlayerBuyIn = (playerId: string, buyIn: number) => {
    setPlayers(players.map(player => 
      player.playerId === playerId 
        ? { ...player, buyIn } 
        : player
    ));
  };
  
  const handleBuyInChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const player = players[index];
    updatePlayerBuyIn(player.playerId, numValue);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>Add Session</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Poker Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Where did you play?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Players</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
              {availablePlayers.map((player) => (
                <div 
                  key={player.id}
                  className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded-md"
                >
                  <Checkbox 
                    id={`player-${player.id}`}
                    checked={selectedPlayers.includes(player.id)}
                    onCheckedChange={() => togglePlayerSelection(player.id)}
                  />
                  <Label 
                    htmlFor={`player-${player.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {player.name}
                  </Label>
                </div>
              ))}
              
              {availablePlayers.length === 0 && (
                <div className="py-2 text-center text-muted-foreground">
                  No players available. Add players first.
                </div>
              )}
            </div>
          </div>
          
          {players.length > 0 && (
            <div className="space-y-2">
              <Label>Buy-ins</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {players.map((player, index) => (
                  <div key={player.playerId} className="flex items-center space-x-3">
                    <span className="min-w-[100px] text-sm">{player.name}</span>
                    <div className="flex items-center space-x-2 flex-grow">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const current = players[index].buyIn;
                          handleBuyInChange(index, Math.max(0, current - 25).toString());
                        }}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="0"
                        step="25"
                        value={player.buyIn || ''}
                        onChange={(e) => handleBuyInChange(index, e.target.value)}
                        className="w-20 text-center"
                      />
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const current = players[index].buyIn;
                          handleBuyInChange(index, (current + 25).toString());
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button type="submit" disabled={players.length < 2 || !location.trim()}>
              Create Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionForm;
