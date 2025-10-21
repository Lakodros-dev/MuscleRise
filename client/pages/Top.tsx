import Layout from "@/components/Layout";
import { useAppState } from "@/state/app-state";
import { useState, useEffect } from "react";

interface LeaderboardUser {
  id: string;
  username: string;
  name: string;
  coins: number;
  todayCalories: number;
  todayExercises: number;
  avatarUrl?: string;
}

export default function TopPage() {
  const { state } = useAppState();
  const [mode, setMode] = useState<"coins" | "activity">("coins");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        // Fallback to empty array if server is not available
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const usersByCoins = [...users].sort((a, b) => b.coins - a.coins);
  const usersByActivity = [...users].sort((a, b) => b.todayExercises - a.todayExercises);

  const list = mode === "coins" ? usersByCoins : usersByActivity;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Top Users</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode("coins")} className={"px-3 py-1 rounded border " + (mode === "coins" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>By Coins</button>
          <button onClick={() => setMode("activity")} className={"px-3 py-1 rounded border " + (mode === "activity" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>By Activity</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="text-foreground/70">Loading users...</div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="text-red-500">{error}</div>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="text-foreground/70">No users found</div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border relative z-0">
          {list.map((u, idx) => {
            const isCurrentUser = state.user?.id === u.id;
            const displayValue = mode === "coins" ? u.coins : u.todayExercises;
            const displayUnit = mode === "coins" ? "coins" : "exercises today";
            
            return (
              <div key={u.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-bold">#{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {u.avatarUrl && (
                      <img 
                        src={u.avatarUrl} 
                        alt={`${u.name} avatar`} 
                        className="w-8 h-8 rounded-full object-cover border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium">{u.name}{isCurrentUser ? " (You)" : ""}</div>
                      <div className="text-xs text-foreground/70">{displayValue} {displayUnit}</div>
                    </div>
                  </div>
                </div>
                <button className="text-xs rounded-md border border-border px-3 py-1 bg-muted hover:bg-muted/80">View stats</button>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-foreground/60">Real-time data from server users.</p>
    </Layout>
  );
}
