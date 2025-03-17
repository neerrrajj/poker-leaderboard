
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pokerDB, formatCurrency, formatDate } from '@/lib/data';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingDown, TrendingUp, Calendar, DollarSign, MoveLeft } from 'lucide-react';

const PlayerDetails = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (playerId) {
        const data = await pokerDB.getPlayerStats(playerId);
        if (data) {
          setPlayerData(data);
        }
      }
    }
    
    loadData()
  }, [playerId]);

  if (!playerData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
          <h1>Player not found</h1>
        </main>
      </div>
    );
  }

  const { player, sessions, stats } = playerData;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/players')}
              className="h-8 w-8"
            >
              <MoveLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{player.name}'s Profile</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sessions:</span>
                  <span className="font-medium">{player.sessionsPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Buy-in:</span>
                  <span className="font-medium">{formatCurrency(player.totalBuyIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cash-out:</span>
                  <span className="font-medium">{formatCurrency(player.totalCashOut)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Net Profit:</span>
                  <div className="flex items-center">
                    {stats.totalProfit >= 0 ? (
                      <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(stats.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-medium">{(stats.winRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Buy-in:</span>
                  <span className="font-medium">{formatCurrency(stats.averageBuyIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biggest Win:</span>
                  <span className="font-medium text-green-500">{formatCurrency(stats.biggestWin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biggest Loss:</span>
                  <span className="font-medium text-red-500">{formatCurrency(Math.abs(stats.biggestLoss))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Sessions where {player.name} is still playing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.filter(s => s.cashOut === null).length > 0 ? (
                <div className="space-y-3">
                  {sessions.filter(s => s.cashOut === null).map(session => (
                    <div key={session.sessionId} className="flex justify-between items-center p-2 border rounded-md">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatDate(session.date)}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/sessions/${session.sessionId}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active sessions</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Buy-in</TableHead>
                    <TableHead>Cash-out</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>{formatDate(session.date)}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell>{formatCurrency(session.buyIn)}</TableCell>
                      <TableCell>
                        {session.cashOut !== null ? formatCurrency(session.cashOut) : 'Still playing'}
                      </TableCell>
                      <TableCell>
                        {session.profit !== null ? (
                          <div className="flex items-center">
                            {session.profit >= 0 ? (
                              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                            )}
                            <span className={session.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatCurrency(session.profit)}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${session.isActive ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                          {session.isActive ? 'Active' : 'Completed'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/sessions/${session.sessionId}`)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-6 text-muted-foreground">No sessions found.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlayerDetails;
