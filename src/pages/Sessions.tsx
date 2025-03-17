import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { pokerDB, formatCurrency, formatDate, Session, Player } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, ArrowUpDown } from 'lucide-react';
import AddSessionForm from '@/components/ui/AddSessionForm';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [playerDetails, setPlayerDetails] = useState<Record<string, Player | undefined>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const fetchedSessions = await pokerDB.getSessions();
      setSessions(fetchedSessions);

      // Load player details
      // const details: Record<string, Player | undefined> = {};
      // await Promise.all(sessionData.players.map(async (player) => {
      //   details[player.playerId] = await pokerDB.getPlayerById(player.playerId);
      // }));
      // setPlayerDetails(details);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refreshSessions();
  }, []);
  
  const filteredSessions = sessions
    .filter(session => {
      // Filter by search term (location)
      const matchesSearch = session.location.toLowerCase().includes(searchTerm.toLowerCase());
      // Filter by status
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && session.isActive) ||
        (filterStatus === 'completed' && !session.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'location') {
        return sortOrder === 'asc'
          ? a.location.localeCompare(b.location)
          : b.location.localeCompare(a.location);
      } else if (sortBy === 'players') {
        return sortOrder === 'asc'
          ? a.players.length - b.players.length
          : b.players.length - a.players.length;
      }
      return 0;
    });
    
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  if (isLoading && sessions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
          <div>Loading sessions...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
              <p className="text-muted-foreground">Manage your poker sessions</p>
            </div>
            <AddSessionForm onSessionAdded={refreshSessions} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter">Status</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger id="filter" className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="completed">Completed Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sort">Sort By</Label>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={sortBy}
                        onValueChange={setSortBy}
                      >
                        <SelectTrigger id="sort" className="w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="players">Number of Players</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleSortOrder}
                        title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                      >
                        <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSessions.map((session) => (
                      <Link 
                        key={session.id} 
                        to={`/sessions/${session.id}`}
                        className="block"
                      >
                        <Card className="h-full hover:shadow-md transition-shadow card-hover">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center">
                                <CalendarDays className="h-5 w-5 text-primary mr-2" />
                                <h3 className="font-semibold text-lg">{session.location}</h3>
                              </div>
                              <Badge variant={session.isActive ? "default" : "secondary"}>
                                {session.isActive ? "Active" : "Completed"}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <p className="text-muted-foreground">
                                <strong>Date:</strong> {formatDate(session.date)}
                              </p>
                              <p className="text-muted-foreground">
                                <strong>Players:</strong> {session.players.length}
                              </p>
                              
                              {/* {!session.isActive && (
                                <div className="mt-4">
                                  <p className="font-medium">Results:</p>
                                  <div className="space-y-1 mt-2">
                                    {session.players.map((player) => {
                                      const playerData = playerDetails[player.playerId];
                                      if (!playerData || player.cashOut === null) return null;
                                      
                                      const profit = player.cashOut - player.buyIn;
                                      return (
                                        <div key={player.playerId} className="flex justify-between">
                                          <span>{playerData.name}</span>
                                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                            {formatCurrency(profit)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )} */}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterStatus !== 'all' 
                        ? "Try adjusting your filters" 
                        : "Create your first poker session to get started"}
                    </p>
                    {!searchTerm && filterStatus === 'all' && (
                      <AddSessionForm onSessionAdded={refreshSessions} />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Sessions;
