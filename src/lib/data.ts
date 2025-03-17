import { toast } from "sonner";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Types (remain the same)
export interface Player {
  id: string;
  name: string;
  totalBuyIn: number;
  totalCashOut: number;
  sessionsPlayed: number;
  createdAt: Date;
}

export interface PlayerSession {
  playerId: string;
  buyIn: number;
  cashOut: number | null;
}

export interface Session {
  id: string;
  date: Date;
  location: string;
  players: PlayerSession[];
  isActive: boolean;
  createdAt: Date;
}

// Supabase Database
class PokerDB {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  // Player methods
  async addPlayer(name: string): Promise<string> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const { error } = await this.supabase.from("players").insert({
      id,
      name,
      total_buy_in: 0,
      total_cash_out: 0,
      sessions_played: 0,
      created_at: createdAt,
    });

    if (error) {
      console.error("Failed to add player:", error);
      toast.error("Failed to add player");
      throw error;
    }

    return id;
  }

  async getPlayers(): Promise<Player[]> {
    const { data, error } = await this.supabase.from("players").select("*");

    if (error) {
      console.error("Failed to fetch players:", error);
      return [];
    }

    return data
      .map((row) => ({
        id: row.id,
        name: row.name,
        totalBuyIn: row.total_buy_in,
        totalCashOut: row.total_cash_out,
        sessionsPlayed: row.sessions_played,
        createdAt: new Date(row.created_at),
        profit: row.total_cash_out - row.total_buy_in,
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    const { data, error } = await this.supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch player:", error);
      return undefined;
    }

    return {
      id: data.id,
      name: data.name,
      totalBuyIn: data.total_buy_in,
      totalCashOut: data.total_cash_out,
      sessionsPlayed: data.sessions_played,
      createdAt: new Date(data.created_at),
    };
  }

  async deletePlayer(id: string): Promise<boolean> {
    // Check if player is in any active sessions
    const { count } = await this.supabase
      .from("player_sessions")
      .select("*", { count: "exact", head: true })
      .eq("player_id", id)
      .lt("cash_out", null);

    if (count && count > 0) {
      toast.error("Cannot delete a player who is in an active session");
      return false;
    }

    const { error } = await this.supabase.from("players").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete player:", error);
      return false;
    }

    return true;
  }

  async updatePlayerStats(): Promise<void> {
    // Get all player sessions data
    const { data: playerSessions } = await this.supabase
      .from("player_sessions")
      .select("player_id, buy_in, cash_out, session_id");

    if (!playerSessions) return;

    // Calculate stats for each player
    const playerStats = new Map<
      string,
      {
        totalBuyIn: number;
        totalCashOut: number;
        sessionsPlayed: Set<string>;
      }
    >();

    for (const ps of playerSessions) {
      if (!playerStats.has(ps.player_id)) {
        playerStats.set(ps.player_id, {
          totalBuyIn: 0,
          totalCashOut: 0,
          sessionsPlayed: new Set(),
        });
      }

      const stats = playerStats.get(ps.player_id)!;
      stats.totalBuyIn += ps.buy_in;
      if (ps.cash_out !== null) {
        stats.totalCashOut += ps.cash_out;
      }
      stats.sessionsPlayed.add(ps.session_id);
    }

    // Update all players
    const updates = Array.from(playerStats.entries()).map(
      async ([playerId, stats]) => {
        const { error } = await this.supabase
          .from("players")
          .update({
            total_buy_in: stats.totalBuyIn,
            total_cash_out: stats.totalCashOut,
            sessions_played: stats.sessionsPlayed.size,
          })
          .eq("id", playerId);

        if (error) throw error;
      }
    );

    await Promise.all(updates);
  }

  // Session methods
  async addSession(
    sessionData: Omit<Session, "id" | "isActive" | "createdAt">
  ): Promise<string> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const isActive = sessionData.players.some((p) => p.cashOut === null);

    // Use a transaction
    // const { error } = await this.supabase.rpc('with_transaction', async () => {
    // Insert session
    const { error: sessionError } = await this.supabase
      .from("sessions")
      .insert({
        id,
        date: sessionData.date.toISOString(),
        location: sessionData.location,
        is_active: isActive,
        created_at: createdAt,
      });

    if (sessionError) {
      console.error("Failed to add session:", sessionError);
      toast.error("Failed to create session");
      throw sessionError;
    }

    // Insert player sessions
    const playerSessions = sessionData.players.map((p) => ({
      session_id: id,
      player_id: p.playerId,
      buy_in: p.buyIn,
      cash_out: p.cashOut,
    }));

    const { error: psError } = await this.supabase
      .from("player_sessions")
      .insert(playerSessions);

    if (psError) {
      console.error("Failed to add player sessions:", psError);
      toast.error("Failed to create session");
      throw psError;
    }
    // });

    // if (error) {
    //   console.error("Failed to add session:", error);
    //   toast.error("Failed to create session");
    //   throw error;
    // }

    await this.updatePlayerStats();
    return id;
  }

  async getSessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select(
        `
        id,
        date,
        location,
        is_active,
        created_at,
        player_sessions (
          player_id,
          buy_in,
          cash_out
        )
      `
      )
      .order("date", { ascending: false });

    if (error) {
      console.error("Failed to fetch sessions:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      date: new Date(row.date),
      location: row.location,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      players: row.player_sessions.map((ps: any) => ({
        playerId: ps.player_id,
        buyIn: ps.buy_in,
        cashOut: ps.cash_out,
      })),
    }));
  }

  async getSessionById(id: string): Promise<Session | undefined> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select(
        `
        id,
        date,
        location,
        is_active,
        created_at,
        player_sessions (
          player_id,
          buy_in,
          cash_out
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch session:", error);
      return undefined;
    }

    return {
      id: data.id,
      date: new Date(data.date),
      location: data.location,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      players: data.player_sessions.map((ps: any) => ({
        playerId: ps.player_id,
        buyIn: ps.buy_in,
        cashOut: ps.cash_out,
      })),
    };
  }

  async updateSession(
    sessionId: string,
    updatedData: Partial<Session>
  ): Promise<boolean> {
    const isActive =
      updatedData.players?.some((p) => p.cashOut === null) ?? false;

    try {
      // await this.supabase.rpc("with_transaction", async () => {
      // Update session
      const { error: sessionError } = await this.supabase
        .from("sessions")
        .update({
          date: updatedData.date?.toISOString(),
          location: updatedData.location,
          is_active: isActive,
        })
        .eq("id", sessionId);

      if (sessionError) throw sessionError;

      // If players are updated
      if (updatedData.players) {
        // Delete existing player sessions
        const { error: deleteError } = await this.supabase
          .from("player_sessions")
          .delete()
          .eq("session_id", sessionId);

        if (deleteError) throw deleteError;

        // Insert new player sessions
        const playerSessions = updatedData.players.map((p) => ({
          session_id: sessionId,
          player_id: p.playerId,
          buy_in: p.buyIn,
          cash_out: p.cashOut,
        }));

        const { error: insertError } = await this.supabase
          .from("player_sessions")
          .insert(playerSessions);

        if (insertError) throw insertError;
      }
      // });

      await this.updatePlayerStats();
      return true;
    } catch (error) {
      console.error("Failed to update session:", error);
      return false;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete session:", error);
      return false;
    }

    await this.updatePlayerStats();
    return true;
  }

  // Stats methods
  async getPlayerStats(playerId: string) {
    // Get player data
    const player = await this.getPlayerById(playerId);
    if (!player) return null;

    // Get all sessions for this player
    const { data: sessionsData, error: sessionsError } = await this.supabase
      .from("sessions")
      .select(
        `
        id,
        date,
        location,
        is_active,
        player_sessions!inner(
          buy_in,
          cash_out
        )
      `
      )
      .eq("player_sessions.player_id", playerId)
      .order("date", { ascending: false });

    if (sessionsError) {
      console.error("Failed to fetch player sessions:", sessionsError);
      return {
        player,
        sessions: [],
        stats: {
          totalProfit: 0,
          winRate: 0,
          averageBuyIn: 0,
          biggestWin: 0,
          biggestLoss: 0,
        },
      };
    }

    // Map session data
    const playerSessions = sessionsData.map((row) => ({
      sessionId: row.id,
      date: new Date(row.date),
      location: row.location,
      isActive: row.is_active,
      buyIn: row.player_sessions[0].buy_in,
      cashOut: row.player_sessions[0].cash_out,
      profit:
        row.player_sessions[0].cash_out !== null
          ? row.player_sessions[0].cash_out - row.player_sessions[0].buy_in
          : null,
    }));

    // Filter completed sessions
    const completedSessions = playerSessions.filter((s) => s.profit !== null);

    // Calculate stats
    const totalProfit = player.totalCashOut - player.totalBuyIn;
    const winRate =
      completedSessions.length > 0
        ? completedSessions.filter((s) => (s.profit ?? 0) > 0).length /
          completedSessions.length
        : 0;
    const averageBuyIn =
      player.sessionsPlayed > 0 ? player.totalBuyIn / player.sessionsPlayed : 0;

    // Find biggest win and loss
    let biggestWin = 0;
    let biggestLoss = 0;

    completedSessions.forEach((session) => {
      const profit = session.profit!;
      if (profit > biggestWin) biggestWin = profit;
      if (profit < biggestLoss) biggestLoss = profit;
    });

    return {
      player,
      sessions: playerSessions,
      stats: {
        totalProfit,
        winRate,
        averageBuyIn,
        biggestWin,
        biggestLoss,
      },
    };
  }

  async getOverallStats() {
    // Get total players
    const { count: totalPlayers } = await this.supabase
      .from("players")
      .select("*", { count: "exact", head: true });

    // Get total sessions
    const { count: totalSessions } = await this.supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    // Get completed sessions
    const { count: completedSessions } = await this.supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false);

    // Calculate active sessions
    const activeSessions = (totalSessions || 0) - (completedSessions || 0);

    // Get total money played
    const { data: totalMoneyData, error: moneyError } = await this.supabase
      .from("player_sessions")
      .select("buy_in");

    const totalMoneyPlayed = totalMoneyData
      ? totalMoneyData.reduce((sum, row) => sum + row.buy_in, 0)
      : 0;

    // Get all players and sort in JS
    const { data: playersData, error: playersError } = await this.supabase
      .from("players")
      .select("id, name, total_buy_in, total_cash_out");

    if (playersError) {
      console.error("Failed to fetch players:", playersError);
      return {
        totalPlayers: totalPlayers || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        activeSessions,
        totalMoneyPlayed,
        topWinner: null,
        topLoser: null,
      };
    }

    const sortedPlayers = playersData
      .map((player) => ({
        id: player.id,
        name: player.name,
        profit: player.total_cash_out - player.total_buy_in,
      }))
      .sort((a, b) => b.profit - a.profit); // Sort by profit

    const topWinner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
    const topLoser =
      sortedPlayers.length > 1 ? sortedPlayers[sortedPlayers.length - 1] : null;

    return {
      totalPlayers: totalPlayers || 0,
      totalSessions: totalSessions || 0,
      completedSessions: completedSessions || 0,
      activeSessions,
      totalMoneyPlayed,
      topWinner,
      topLoser,
    };
  }
}

// Export a singleton instance
export const pokerDB = new PokerDB();

// Helper functions for formatting (unchanged)
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};
