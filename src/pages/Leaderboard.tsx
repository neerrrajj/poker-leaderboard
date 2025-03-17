import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { pokerDB, formatCurrency, Player } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof pokerDB.getOverallStats> extends Promise<infer T> ? T : never | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedPlayers, fetchedStats] = await Promise.all([
          pokerDB.getPlayers(),
          pokerDB.getOverallStats()
        ]);
        
        setPlayers(fetchedPlayers);
        setStats(fetchedStats);
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
        toast.error("Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  // Filter players with positive and negative profits
  const winners = players
    .filter(p => (p.totalCashOut - p.totalBuyIn) > 0)
    .sort((a, b) => (b.totalCashOut - b.totalBuyIn) - (a.totalCashOut - a.totalBuyIn));
    
  const losers = players
    .filter(p => (p.totalCashOut - p.totalBuyIn) < 0)
    .sort((a, b) => (a.totalCashOut - a.totalBuyIn) - (b.totalCashOut - b.totalBuyIn));
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground">See who's winning and losing across all poker sessions.</p>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Players</TabsTrigger>
              <TabsTrigger value="winners">Winners</TabsTrigger>
              <TabsTrigger value="losers">Losers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 text-primary mr-2" />
                    Overall Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="space-y-4">
                      {players.map((player, index) => {
                        const profit = player.totalCashOut - player.totalBuyIn;
                        const isPositive = profit >= 0;
                        
                        return (
                          <div key={player.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full mr-4 ${
                                index === 0 ? "bg-yellow-100 text-yellow-700" :
                                index === 1 ? "bg-gray-100 text-gray-700" :
                                index === 2 ? "bg-amber-100 text-amber-700" :
                                "bg-blue-50 text-blue-700"
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {player.sessionsPlayed} sessions
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${isPositive ? "text-poker-green" : "text-poker-red"}`}>
                                {formatCurrency(profit)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(player.totalBuyIn)} in / {formatCurrency(player.totalCashOut)} out
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No players yet. Add some to see the leaderboard!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="winners" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-poker-green mr-2" />
                    Top Winners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {winners.length > 0 ? (
                    <div className="space-y-4">
                      {winners.map((player, index) => {
                        const profit = player.totalCashOut - player.totalBuyIn;
                        return (
                          <div key={player.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 mr-4">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {player.sessionsPlayed} sessions
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-poker-green">
                                {formatCurrency(profit)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Win rate: {((profit / player.totalBuyIn) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No winners yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="losers" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-poker-red mr-2" />
                    Biggest Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {losers.length > 0 ? (
                    <div className="space-y-4">
                      {losers.map((player, index) => {
                        const loss = player.totalCashOut - player.totalBuyIn;
                        return (
                          <div key={player.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 mr-4">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {player.sessionsPlayed} sessions
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-poker-red">
                                {formatCurrency(loss)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Loss rate: {((Math.abs(loss) / player.totalBuyIn) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No losers yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  Money Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Total Money Played:</p>
                    <p className="font-medium">{formatCurrency(stats.totalMoneyPlayed)}</p>
                  </div>
                  {stats.topWinner && (
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Biggest Winner:</p>
                      <p className="font-medium text-poker-green">
                        {stats.topWinner.name} ({formatCurrency(stats.topWinner.profit)})
                      </p>
                    </div>
                  )}
                  {stats.topLoser && (
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Biggest Loser:</p>
                      <p className="font-medium text-poker-red">
                        {stats.topLoser.name} ({formatCurrency(stats.topLoser.profit)})
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Total Sessions:</p>
                    <p className="font-medium">{stats.totalSessions}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Active Sessions:</p>
                    <p className="font-medium">{stats.activeSessions}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Completed Sessions:</p>
                    <p className="font-medium">{stats.completedSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
