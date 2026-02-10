"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const { addToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const registered = searchParams.get("registered");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error || "Login failed");
            addToast({ type: "error", title: "Login Failed", message: result.error });
        } else {
            addToast({ type: "success", title: "Welcome back!", message: "Login successful" });
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen text-white flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617]"></div>
            <div className="bg-nebula-parallax"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#fb923c] to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.4)]">
                        <span className="material-symbols-outlined text-white text-2xl">eco</span>
                    </div>
                    <span className="text-2xl font-bold">Surplus</span>
                </Link>

                {/* Login Card */}
                <div className="glass-card p-8 relative">
                    <div className="glass-highlight"></div>

                    <h1 className="text-2xl font-bold text-center mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-center mb-8">Sign in to continue rescuing food</p>

                    {registered && (
                        <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl mb-6 text-sm">
                            Account created successfully! Please sign in.
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fb923c]/50 focus:border-[#fb923c] transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fb923c]/50 focus:border-[#fb923c] transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-[#fb923c] hover:bg-orange-400 text-slate-900 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(251,146,60,0.3)] hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <span className="material-symbols-outlined text-xl">login</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-[#fb923c] hover:text-orange-300 font-medium">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-2 border-[#fb923c]/30 border-t-[#fb923c] rounded-full animate-spin"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
