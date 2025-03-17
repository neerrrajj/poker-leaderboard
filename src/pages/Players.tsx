
import React, { useState, useEffect } from 'react';
import { pokerDB, Player, formatCurrency } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusCircle, Search, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    refreshPlayers();
  }, []);

  const refreshPlayers = async () => {
    setIsLoading(true);
    try {
      const fetchedPlayers = await pokerDB.getPlayers();
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error("Failed to load players:", error);
      toast.error("Failed to load players");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        await pokerDB.addPlayer(newPlayerName.trim());
        setNewPlayerName('');
        setIsAddPlayerOpen(false);
        await refreshPlayers();
        toast.success(`Player "${newPlayerName.trim()}" added successfully`);
      } catch (error) {
        console.error("Failed to add player:", error);
        toast.error("Failed to add player");
      }
    } else {
      toast.error('Player name cannot be empty');
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    try {
      const result = await pokerDB.deletePlayer(id);
      if (result) {
        await refreshPlayers();
        toast.success(`Player "${name}" deleted successfully`);
      }
    } catch (error) {
      console.error("Failed to delete player:", error);
      toast.error("Failed to delete player");
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPlayerDetails = (playerId: string) => {
    navigate(`/players/${playerId}`);
  };

  if (isLoading && players.length === 0) {
    return <div>Loading players...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Players</h1>
            <p className="text-muted-foreground">Manage your poker players and view their stats.</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Player</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Player Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAddPlayer}
                  >
                    Add Player
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Players</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPlayers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Total Buy-in</TableHead>
                      <TableHead>Total Cash-out</TableHead>
                      <TableHead>Profit/Loss</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player) => {
                      const profit = player.totalCashOut - player.totalBuyIn;
                      const isProfitable = profit >= 0;
                      
                      return (
                        <TableRow key={player.id} className="cursor-pointer" onClick={() => handleViewPlayerDetails(player.id)}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>{player.sessionsPlayed}</TableCell>
                          <TableCell>{formatCurrency(player.totalBuyIn)}</TableCell>
                          <TableCell>{formatCurrency(player.totalCashOut)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {isProfitable ? (
                                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                              )}
                              <span className={isProfitable ? "text-green-500" : "text-red-500"}>
                                {formatCurrency(profit)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPlayerDetails(player.id);
                                }}
                              >
                                View Stats
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {player.name} and remove them from all statistics.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePlayer(player.id, player.name)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No players match your search.' : 'No players added yet.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Players;
