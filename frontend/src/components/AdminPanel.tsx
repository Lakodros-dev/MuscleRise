import { useState, useCallback, memo, useMemo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Users, Eye } from "lucide-react";

interface User {
    id: string;
    username: string;
    coins: number;
    todayCalories: number;
    todayExercises: number;
    weightKg: number;
    heightCm: number;
    planId: string;
    createdAt: string;
    lastActive: string;
}

const AdminPanel = memo(() => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showUserModal, setShowUserModal] = useState(false);

    const usersPerPage = 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { makeApiRequest } = await import("@/lib/api-utils");
            const response = await makeApiRequest('/auth/users');

            if (response.success) {
                setUsers(response.data.users || []);
            } else {
                console.error('Failed to fetch users:', response.error);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserData = useCallback(async (userId: string, updates: Partial<User>) => {
        try {
            const { updateUser } = await import("@/lib/api-utils");
            const response = await updateUser(userId, updates);

            if (response.success) {
                setUsers(prev => prev.map(user =>
                    user.id === userId ? { ...user, ...updates } : user
                ));
                if (selectedUser?.id === userId) {
                    setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
                }
            } else {
                console.error('Failed to update user:', response.error);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }, [selectedUser]);

    const resetUserProgress = useCallback(async (userId: string) => {
        if (!confirm('Foydalanuvchi progressini reset qilishni xohlaysizmi?')) return;

        await updateUserData(userId, {
            coins: 0,
            todayCalories: 0,
            todayExercises: 0
        });
    }, [updateUserData]);

    // Filter and paginate users with memoization
    const filteredUsers = useMemo(() =>
        users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]
    );

    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        const startIndex = (currentPage - 1) * usersPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

        return { totalPages, startIndex, paginatedUsers };
    }, [filteredUsers, currentPage, usersPerPage]);

    const { totalPages, startIndex, paginatedUsers } = paginationData;

    const UserModal = memo(({ user, onClose }: { user: User; onClose: () => void }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Foydalanuvchi ma'lumotlari</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={user.username}
                            readOnly
                            className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Coins</label>
                        <input
                            type="number"
                            value={user.coins}
                            onChange={(e) => updateUserData(user.id, { coins: parseInt(e.target.value) || 0 })}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Vazn (kg)</label>
                        <input
                            type="number"
                            value={user.weightKg}
                            onChange={(e) => updateUserData(user.id, { weightKg: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bo'y (cm)</label>
                        <input
                            type="number"
                            value={user.heightCm}
                            onChange={(e) => updateUserData(user.id, { heightCm: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 border rounded dark:bg-gray-700"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => resetUserProgress(user.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Progress
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Admin Panel
                </h2>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yangilash
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Foydalanuvchi qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Coins</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Bugungi Kaloriya</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Mashqlar</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Oxirgi faollik</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4 animate-spin" />
                                            Yuklanmoqda...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Foydalanuvchilar topilmadi
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium">{user.username}</td>
                                        <td className="px-4 py-3">{user.coins}</td>
                                        <td className="px-4 py-3">{user.todayCalories}</td>
                                        <td className="px-4 py-3">{user.todayExercises}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(user.lastActive).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowUserModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ko'rish
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            {filteredUsers.length} dan {startIndex + 1}-{Math.min(startIndex + usersPerPage, filteredUsers.length)} ko'rsatilmoqda
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded border disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {showUserModal && selectedUser && (
                <UserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
});

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;
