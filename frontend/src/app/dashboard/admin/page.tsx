"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiService } from "@/lib/api-service";
import { useWebSocket } from "@/lib/websocket-service";
import { useToast } from "@/lib/toast-context";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    is_active: boolean;
}

interface NGO {
    id: string;
    name: string;
    email: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
}

interface Stats {
    total_users: number;
    total_donations: number;
    total_rescued_kg: number;
    active_volunteers: number;
    pending_ngos: number;
    co2_prevented: number;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "ngos" | "donations">("overview");
    const [users, setUsers] = useState<User[]>([]);
    const [ngos, setNgos] = useState<NGO[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    // Real-time updates
    useWebSocket(["task_created", "task_completed", "volunteer_online"], (message) => {
        addToast({
            type: "info",
            title: "Real-time Update",
            message: `${message.type}: ${JSON.stringify(message.payload).slice(0, 50)}...`,
        });
        fetchData(); // Refresh stats
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, ngosRes, statsRes] = await Promise.all([
                apiService.getAdminUsers(),
                apiService.getAdminNgos(),
                apiService.getAdminStats(),
            ]);

            if (usersRes.data) setUsers(usersRes.data);
            if (ngosRes.data) setNgos(ngosRes.data);
            if (statsRes.data) setStats(statsRes.data);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveNgo = async (id: string) => {
        const res = await apiService.approveNgo(id);
        if (!res.error) {
            addToast({ type: "success", title: "NGO Approved", message: "The NGO has been activated" });
            fetchData();
        } else {
            addToast({ type: "error", title: "Error", message: res.error });
        }
    };

    const handleRejectNgo = async (id: string) => {
        const res = await apiService.rejectNgo(id);
        if (!res.error) {
            addToast({ type: "warning", title: "NGO Rejected", message: "The NGO application was rejected" });
            fetchData();
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        const res = await apiService.deleteUser(id);
        if (!res.error) {
            addToast({ type: "success", title: "User Deleted" });
            fetchData();
        }
    };

    const handleLogout = () => {
        apiService.logout();
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
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                        <span className="material-symbols-outlined text-white">admin_panel_settings</span>
                    </div>
                    <span className="text-xl font-bold">Admin Panel</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: "overview", icon: "dashboard", label: "Overview" },
                        { id: "users", icon: "group", label: "Users" },
                        { id: "ngos", icon: "volunteer_activism", label: "NGO Approvals" },
                        { id: "donations", icon: "inventory_2", label: "All Donations" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                    ? "bg-red-500/20 text-red-400"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8 relative z-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-slate-400 mt-1">System management and oversight</p>
                </header>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            {[
                                { label: "Total Users", value: stats?.total_users || 0, icon: "group", color: "blue" },
                                { label: "Donations", value: stats?.total_donations || 0, icon: "inventory_2", color: "green" },
                                { label: "Rescued (kg)", value: stats?.total_rescued_kg || 0, icon: "scale", color: "orange" },
                                { label: "Active Volunteers", value: stats?.active_volunteers || 0, icon: "local_shipping", color: "purple" },
                                { label: "Pending NGOs", value: stats?.pending_ngos || 0, icon: "pending", color: "yellow" },
                                { label: "CO₂ Prevented (T)", value: stats?.co2_prevented || 0, icon: "eco", color: "teal" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-4 relative">
                                    <div className="glass-highlight"></div>
                                    <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                                        <span className={`material-symbols-outlined text-${stat.color}-400`}>{stat.icon}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card p-6 relative">
                                <div className="glass-highlight"></div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-400">pending</span>
                                    Pending NGO Approvals
                                </h2>
                                <div className="space-y-3">
                                    {ngos.filter(n => n.status === "pending").slice(0, 5).map((ngo) => (
                                        <div key={ngo.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                                            <div>
                                                <p className="font-medium">{ngo.name}</p>
                                                <p className="text-sm text-slate-400">{ngo.email}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveNgo(ngo.id)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleRejectNgo(ngo.id)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {ngos.filter(n => n.status === "pending").length === 0 && (
                                        <p className="text-slate-400 text-center py-4">No pending approvals</p>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card p-6 relative">
                                <div className="glass-highlight"></div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400">insights</span>
                                    Recent Activity
                                </h2>
                                <div className="space-y-3">
                                    {users.slice(0, 5).map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    <p className="text-xs text-slate-400">{user.role}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${user.is_active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">All Users</h2>
                            <span className="text-slate-400">{users.length} total</span>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-slate-400 text-sm border-b border-white/10">
                                            <th className="pb-3 font-medium">Name</th>
                                            <th className="pb-3 font-medium">Email</th>
                                            <th className="pb-3 font-medium">Role</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-white/5">
                                                <td className="py-4">{user.name}</td>
                                                <td className="py-4 text-slate-400">{user.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === "admin" ? "bg-red-500/20 text-red-400" :
                                                            user.role === "ngo" ? "bg-purple-500/20 text-purple-400" :
                                                                user.role === "volunteer" ? "bg-blue-500/20 text-blue-400" :
                                                                    "bg-green-500/20 text-green-400"
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.is_active ? "bg-green-400" : "bg-slate-500"}`}></span>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </td>
                                                <td className="py-4">
                                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 text-sm">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* NGOs Tab */}
                {activeTab === "ngos" && (
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <h2 className="text-xl font-bold mb-6">NGO Applications</h2>

                        <div className="space-y-4">
                            {ngos.map((ngo) => (
                                <div key={ngo.id} className="p-4 bg-slate-800/30 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-purple-400">volunteer_activism</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{ngo.name}</p>
                                            <p className="text-sm text-slate-400">{ngo.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ngo.status === "approved" ? "bg-green-500/20 text-green-400" :
                                                ngo.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                                    "bg-yellow-500/20 text-yellow-400"
                                            }`}>
                                            {ngo.status}
                                        </span>
                                        {ngo.status === "pending" && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleApproveNgo(ngo.id)} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleRejectNgo(ngo.id)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {ngos.length === 0 && (
                                <p className="text-center text-slate-400 py-8">No NGO applications</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Donations Tab */}
                {activeTab === "donations" && (
                    <div className="glass-card p-6 relative">
                        <div className="glass-highlight"></div>
                        <h2 className="text-xl font-bold mb-6">All Donations</h2>
                        <p className="text-slate-400 text-center py-12">Donation management coming soon...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
