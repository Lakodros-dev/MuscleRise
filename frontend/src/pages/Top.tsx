import Layout from "@/components/Layout";
import { useAppState } from "@/state/app-state";
import { useState, useEffect } from "react";
import { useTranslationWithState } from "@/lib/i18n";

interface LeaderboardUser {
  id: string;
  username: string;
  name: string;
  coins: number;
  todayCalories: number;
  todayExercises: number;
  totalExercises?: number;
  avatarUrl?: string;
}

interface UserStats {
  totalWorkouts: number;
  totalExercises: number;
  totalCalories: number;
  averageCaloriesPerDay: number;
  streak: number;
  lastWorkoutDate: string;
}

export default function TopPage() {
  const { state } = useAppState();
  const { t } = useTranslationWithState(state.language);
  const [mode, setMode] = useState<"coins" | "activity">("coins");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { makeApiRequest } = await import("@/lib/api-utils");
        const response = await makeApiRequest('/auth/users');

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch users');
        }

        setUsers(response.data?.users || []);
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
  const usersByActivity = [...users].sort((a, b) => (b.totalExercises || b.todayExercises) - (a.totalExercises || a.todayExercises));

  const list = mode === "coins" ? usersByCoins : usersByActivity;

  const handleViewStats = async (user: LeaderboardUser) => {
    setSelectedUser(user);
    setStatsLoading(true);
    setUserStats(null);

    try {
      const { makeApiRequest } = await import("@/lib/api-utils");
      const response = await makeApiRequest(`/auth/user/${user.id}/stats`);

      if (response.success && response.data) {
        setUserStats(response.data);
      } else {
        // Fallback stats if API fails
        setUserStats({
          totalWorkouts: 0,
          totalExercises: user.totalExercises || user.todayExercises || 0,
          totalCalories: user.todayCalories || 0,
          averageCaloriesPerDay: 0,
          streak: 0,
          lastWorkoutDate: 'N/A'
        });
      }
    } catch (error) {
      console.warn('Failed to fetch user stats:', error);
      // Fallback stats
      setUserStats({
        totalWorkouts: 0,
        totalExercises: user.totalExercises || user.todayExercises || 0,
        totalCalories: user.todayCalories || 0,
        averageCaloriesPerDay: 0,
        streak: 0,
        lastWorkoutDate: 'N/A'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t.top.title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode("coins")} className={"px-3 py-1 rounded border " + (mode === "coins" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>By {t.common.coins}</button>
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
            const displayValue = mode === "coins" ? u.coins : (u.totalExercises || u.todayExercises);
            const displayUnit = mode === "coins" ? t.common.coins : `total ${t.common.exercises}`;

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
                <button
                  onClick={() => handleViewStats(u)}
                  className="text-xs rounded-md border border-border px-3 py-1 bg-muted hover:bg-muted/80 transition-colors"
                >
                  {t.top.viewStats}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-foreground/60">Real-time data from server users.</p>

      {/* User Stats Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t.top.userStatistics}</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {selectedUser.avatarUrl && (
                <img
                  src={selectedUser.avatarUrl}
                  alt={`${selectedUser.name} avatar`}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <div className="font-semibold text-lg">{selectedUser.name}</div>
                <div className="text-sm text-white/70">@{selectedUser.username}</div>
              </div>
            </div>

            {statsLoading ? (
              <div className="text-center py-8">
                <div className="text-white/70">{t.top.loadingStatistics}</div>
              </div>
            ) : userStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-emerald-400">{userStats.totalExercises}</div>
                    <div className="text-xs text-white/70">{t.top.totalExercises}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-sky-400">{userStats.totalCalories}</div>
                    <div className="text-xs text-white/70">{t.top.totalCalories}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.totalWorkouts}</div>
                    <div className="text-xs text-white/70">{t.top.totalWorkouts}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-2xl font-bold text-pink-400">{userStats.streak}</div>
                    <div className="text-xs text-white/70">{t.top.dayStreak}</div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-lg font-semibold text-purple-400">{Math.round(userStats.averageCaloriesPerDay)}</div>
                  <div className="text-xs text-white/70">{t.top.averageCaloriesPerDay}</div>
                </div>

                {userStats.lastWorkoutDate !== 'N/A' && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm font-medium">{t.top.lastWorkout}</div>
                    <div className="text-xs text-white/70">{userStats.lastWorkoutDate}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-red-400">{t.top.failedToLoadStats}</div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
              >
                {t.top.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
