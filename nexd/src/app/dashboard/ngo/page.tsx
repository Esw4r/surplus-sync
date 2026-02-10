"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiService } from "../../../lib/api-service";
import { useWebSocket, WebSocketMessage } from "../../../lib/websocket-service";
import { useToast } from "../../../lib/toast-context";
import { useAuth } from "../../../lib/auth-context";

interface Task {
    id: string;
    food_type: string;
    quantity: number;
    status: string;
    pickup_address: string;
    created_at: string;
}

export default function NgoDashboard() {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [claimedTasks, setClaimedTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"available" | "claimed">("available");

    // Real-time updates
    useWebSocket(["task_created", "donation_claimed"], (message: WebSocketMessage) => {
        if (message.type === "task_created") {
            addToast({
                type: "info",
                title: "New Donation Available",
                message: `${message.payload.food_type} - ${message.payload.quantity}kg`,
            });
            fetchTasks();
        }
        if (message.type === "donation_claimed") {
            addToast({
                type: "success",
                title: "Donation Claimed",
                message: "Task added to your claims",
            });
            fetchTasks();
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const [availableRes, claimedRes] = await Promise.all([
                apiService.getNgoNearbyTasks(),
                apiService.getNgoClaimedTasks(),
            ]);

            if (availableRes.data) setTasks(availableRes.data);
            if (claimedRes.data) setClaimedTasks(claimedRes.data);
        } catch (error) {
            addToast({ type: "error", title: "Error", message: "Failed to load tasks" });
        } finally {
            setIsLoading(false);
        }
    };

    const claimTask = async (taskId: string) => {
        const res = await apiService.claimTask(taskId);
        if (!res.error) {
            addToast({ type: "success", title: "Success", message: "Donation claimed successfully" });
            fetchTasks();
        } else {
            addToast({ type: "error", title: "Error", message: res.error });
        }
    };

    return (
        <div className="min-h-screen text-white">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617]"></div>
            <div className="bg-nebula-parallax"></div>

            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 glass-card rounded-none border-r border-white/10 z-40 p-6 flex flex-col">
                <div className="glass-highlight"></div>

                <Link href="/" className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#fb923c] to-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(251,146,60,0.4)]">
                        <span className="material-symbols-outlined text-white">eco</span>
                    </div>
                    <span className="text-xl font-bold">Surplus</span>
                </Link>

                {/* User Info */}
                {user && (
                    <div className="mb-6 p-3 bg-slate-800/30 rounded-xl">
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                )}

                <nav className="flex-1 space-y-2">
                    <button onClick={() => setActiveTab("available")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "available" ? "bg-[#fb923c]/20 text-[#fb923c]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                        <span className="material-symbols-outlined">inventory_2</span>
                        <span className="font-medium">Available Donations</span>
                    </button>
                    <button onClick={() => setActiveTab("claimed")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "claimed" ? "bg-[#fb923c]/20 text-[#fb923c]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                        <span className="material-symbols-outlined">fact_check</span>
                        <span className="font-medium">My Claims</span>
                    </button>
                </nav>

                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8 relative z-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">NGO Dashboard</h1>
                    <p className="text-slate-400 mt-1">Manage your food rescue operations</p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-400 text-2xl">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{tasks.length}</p>
                                <p className="text-sm text-slate-400">Available</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#fb923c]/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#fb923c] text-2xl">fact_check</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{claimedTasks.length}</p>
                                <p className="text-sm text-slate-400">Claimed</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-400 text-2xl">scale</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{claimedTasks.reduce((sum, t) => sum + t.quantity, 0)}kg</p>
                                <p className="text-sm text-slate-400">Total Rescued</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="glass-card p-6 relative">
                    <div className="glass-highlight"></div>
                    <h2 className="text-xl font-bold mb-6">{activeTab === "available" ? "Available Donations" : "My Claims"}</h2>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-[#fb923c]/30 border-t-[#fb923c] rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(activeTab === "available" ? tasks : claimedTasks).length === 0 ? (
                                <p className="text-center text-slate-400 py-8">No {activeTab === "available" ? "available donations" : "claimed tasks"} at the moment</p>
                            ) : (
                                (activeTab === "available" ? tasks : claimedTasks).map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-[#fb923c]/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#fb923c]">restaurant</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{task.food_type}</p>
                                                <p className="text-sm text-slate-400">{task.pickup_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold">{task.quantity}kg</span>
                                            {activeTab === "available" ? (
                                                <button
                                                    onClick={() => claimTask(task.id)}
                                                    className="px-4 py-2 bg-[#fb923c] hover:bg-orange-400 text-slate-900 rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(251,146,60,0.3)]"
                                                >
                                                    Claim
                                                </button>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                                                        task.status === "IN_TRANSIT" ? "bg-blue-500/20 text-blue-400" :
                                                            "bg-[#fb923c]/20 text-[#fb923c]"
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
