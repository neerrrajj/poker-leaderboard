
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pokerDB, Session, formatCurrency, formatDate, Player } from '@/lib/data';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

const SessionDetails = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [cashOutValues, setCashOutValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [playerDetails, setPlayerDetails] = useState<Record<string, Player | undefined>>({});

  useEffect(() => {
    const loadSessionData = async () => {
      setIsLoading(true);
      if (sessionId) {
        try {
          const sessionData = await pokerDB.getSessionById(sessionId);
          if (sessionData) {
            setSession(sessionData);
            setLocation(sessionData.location);
            setDate(sessionData.date.toISOString().split('T')[0]);
            
            // Initialize cash out values for active players
            const initialCashOutValues: Record<string, string> = {};
            sessionData.players.forEach(player => {
              if (player.cashOut === null) {
                initialCashOutValues[player.playerId] = player.buyIn.toString();
              }
            });
            setCashOutValues(initialCashOutValues);

            // Load player details
            const details: Record<string, Player | undefined> = {};
            await Promise.all(sessionData.players.map(async (player) => {
              details[player.playerId] = await pokerDB.getPlayerById(player.playerId);
            }));
            setPlayerDetails(details);
          }
        } catch (error) {
          console.error("Failed to load session:", error);
          toast.error("Failed to load session details");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSessionData();
  }, [sessionId]);

  const handleSave = async () => {
    if (!session || !sessionId) return;
    
    try {
      const updatedSession = {
        ...session,
        location,
        date: new Date(date)
      };
      
      await pokerDB.updateSession(sessionId, updatedSession);
      setSession(updatedSession);
      setIsEditing(false);
      toast.success('Session updated successfully');
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error('Failed to update session');
    }
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    
    try {
      const result = await pokerDB.deleteSession(sessionId);
      if (result) {
        toast.success('Session deleted successfully');
        navigate('/sessions');
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error('Failed to delete session');
    }
  };

  const handleCashOutChange = (playerId: string, value: string) => {
    setCashOutValues({
      ...cashOutValues,
      [playerId]: value
    });
  };

  const handleCashOut = async (playerId: string) => {
    if (!session || !sessionId) return;
    
    const cashOutValue = parseFloat(cashOutValues[playerId]);
    if (isNaN(cashOutValue)) {
      toast.error('Please enter a valid cash out amount');
      return;
    }
    
    // Calculate total current cash out amount
    let totalCurrentCashOut = 0;
    session.players.forEach(player => {
      if (player.cashOut !== null) {
        totalCurrentCashOut += player.cashOut;
      }
    });
    
    // Calculate total buy-in
    const totalBuyIn = session.players.reduce((total, player) => total + player.buyIn, 0);
    
    // Calculate how much is available to cash out for this player
    const playerToUpdate = session.players.find(p => p.playerId === playerId);
    if (!playerToUpdate) return;
    
    // Add this player's cash out to the total
    const newTotalCashOut = totalCurrentCashOut + cashOutValue;
    
    // Check if the new total cash out exceeds total buy-in
    if (newTotalCashOut > totalBuyIn) {
      toast.error('Total cash out cannot exceed total buy-in for the session');
      return;
    }

    try {
      const updatedPlayers = session.players.map(player => {
        if (player.playerId === playerId) {
          return {
            ...player,
            cashOut: cashOutValue
          };
        }
        return player;
      });
      
      const updatedSession = {
        ...session,
        players: updatedPlayers,
        isActive: updatedPlayers.some(p => p.cashOut === null)
      };
      
      await pokerDB.updateSession(sessionId, updatedSession);
      setSession(updatedSession);
      toast.success('Player cashed out successfully');
    } catch (error) {
      console.error("Failed to update player cash out:", error);
      toast.error('Failed to cash out player');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
          <div>Loading session details...</div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
          <h1>Session not found</h1>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Session Details</h1>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setIsEditing(true)}>Edit Session</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Session</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the session and all its data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Date:</strong> {formatDate(session.date)}</p>
                <p><strong>Location:</strong> {session.location}</p>
                <p><strong>Status:</strong> {session.isActive ? 'Active' : 'Completed'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.players.map((player) => {
                const playerData = playerDetails[player.playerId];
                return (
                  <div key={player.playerId} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{playerData?.name}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Buy-in:</strong> {formatCurrency(player.buyIn)}</p>
                      {player.cashOut !== null ? (
                        <>
                          <p><strong>Cash-out:</strong> {formatCurrency(player.cashOut)}</p>
                          <p className={player.cashOut > player.buyIn ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            <strong>Profit:</strong> {formatCurrency(player.cashOut - player.buyIn)}
                          </p>
                        </>
                      ) : (
                        <div className="flex flex-col items-end space-y-2">
                          <p><strong>Cash-out:</strong> Still playing</p>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={cashOutValues[player.playerId] || ''}
                              onChange={(e) => handleCashOutChange(player.playerId, e.target.value)}
                              className="w-28"
                              placeholder="Amount"
                            />
                            <Button 
                              onClick={() => handleCashOut(player.playerId)}
                              size="sm"
                              className="flex items-center"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Cash Out
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SessionDetails;
