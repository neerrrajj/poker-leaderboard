import { useState, useEffect } from "react";
import { pokerDB, formatCurrency, Player, Session } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/ui/StatCard";
import AddPlayerForm from "@/components/ui/AddPlayerForm";
import AddSessionForm from "@/components/ui/AddSessionForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerCard from "@/components/ui/PlayerCard";
import SessionCard from "@/components/ui/SessionCard";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import {
  Users,
  CalendarDays,
  DollarSign,
  Trophy,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [stats, setStats] =
    useState<
      ReturnType<typeof pokerDB.getOverallStats> extends Promise<infer T>
        ? T
        : never | null
    >(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("players");
  const navigate = useNavigate();

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [newStats, newPlayers, newSessions] = await Promise.all([
        pokerDB.getOverallStats(),
        pokerDB.getPlayers(),
        pokerDB.getSessions(),
      ]);

      setStats(newStats);
      setPlayers(newPlayers);
      setSessions(newSessions.slice(0, 3));
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <Navigation />

      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6 pb-20 sm:pb-6">
        <div className="flex flex-col space-y-8">
          <div className="flex justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Poker Leaderboard
              </h1>
              <p className="text-muted-foreground">
                Track your poker sessions and see who's winning.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-start gap-4">
              <AddPlayerForm onPlayerAdded={refreshData} />
              <AddSessionForm onSessionAdded={refreshData} />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Players"
              value={stats.totalPlayers}
              icon={<Users className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title="Total Sessions"
              value={stats.totalSessions}
              icon={<CalendarDays className="h-6 w-6 text-primary" />}
              description={`${stats.activeSessions} active`}
            />
            <StatCard
              title="Money Played"
              value={formatCurrency(stats.totalMoneyPlayed)}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
            />
            {stats.topWinner && (
              <StatCard
                title="Top Winner"
                value={stats.topWinner.name}
                icon={<Trophy className="h-6 w-6 text-primary" />}
                description={formatCurrency(stats.topWinner.profit)}
                // trend="up"
              />
            )}
          </div>

          {/* Recent Players & Sessions */}
          <Tabs
            defaultValue="players"
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList className="mb-4">
                <TabsTrigger value="players">Recent Players</TabsTrigger>
                <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(activeTab === "players" ? "/players" : "/sessions")
                  }
                >
                  View All
                </Button>
              </div>
            </div>

            <TabsContent value="players" className="mt-0 space-y-4">
              {players.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {players
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .slice(0, 3)
                    .map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        onDelete={refreshData}
                      />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-40">
                    <Users className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No players yet. Add some to get started!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sessions" className="mt-0 space-y-4">
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onDelete={refreshData}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-40">
                    <CalendarDays className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No sessions yet. Add your first poker session!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Statistics Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Latest Results
              </h2>
              <p className="text-muted-foreground">
                Recent performance across all sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Winners */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-poker-green mr-2" />
                    Top Winners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="space-y-4">
                      {players
                        .filter((p) => p.totalCashOut - p.totalBuyIn > 0)
                        .slice(0, 3)
                        .map((player, index) => {
                          const profit =
                            player.totalCashOut - player.totalBuyIn;
                          return (
                            <div
                              key={player.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 mr-4">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {player.sessionsPlayed} sessions
                                  </p>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-poker-green">
                                {formatCurrency(profit)}
                              </p>
                            </div>
                          );
                        })}
                      {players.filter((p) => p.totalCashOut - p.totalBuyIn > 0)
                        .length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No winners yet.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Add players to see winners.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top Losers */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-poker-red mr-2" />
                    Biggest Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="space-y-4">
                      {players
                        .filter((p) => p.totalCashOut - p.totalBuyIn < 0)
                        .sort(
                          (a, b) =>
                            a.totalCashOut -
                            a.totalBuyIn -
                            (b.totalCashOut - b.totalBuyIn)
                        )
                        .slice(0, 3)
                        .map((player, index) => {
                          const loss = player.totalCashOut - player.totalBuyIn;
                          return (
                            <div
                              key={player.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 mr-4">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {player.sessionsPlayed} sessions
                                  </p>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-poker-red">
                                {formatCurrency(loss)}
                              </p>
                            </div>
                          );
                        })}
                      {players.filter(
                        (p) => Math.sign(p.totalCashOut - p.totalBuyIn) === -1
                      ).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No losers yet.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Add players to see losers.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
