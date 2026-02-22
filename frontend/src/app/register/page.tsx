"use client";

import { useState, Suspense, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "../../lib/api-service";
import { useToast } from "../../lib/toast-context";

const inputClass = "w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fb923c]/50 focus:border-[#fb923c] transition-all";
const labelClass = "block text-sm font-medium text-slate-300 mb-2";

function RegisterForm() {
    const router = useRouter();
    const { addToast } = useToast();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 1 data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        confirmPassword: "",
    });

    // GPS
    const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    // Step 2 data
    const [licenseData, setLicenseData] = useState({
        licenseNumber: "",
        licenseExpiry: "",
        registrationType: "DARPAN",
    });
    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");

    // Password strength
    const getPasswordStrength = (pw: string) => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (pw.length >= 12) score++;
        return score;
    };

    const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"];
    const pwStrength = getPasswordStrength(formData.password);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus("error");
            addToast({ type: "error", title: "GPS Unavailable", message: "Geolocation is not supported by your browser" });
            return;
        }
        setGpsStatus("loading");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
                setGpsStatus("success");
                addToast({ type: "success", title: "Location Detected", message: `Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` });
            },
            (err) => {
                setGpsStatus("error");
                addToast({ type: "error", title: "Location Error", message: "Could not detect location. Please enter address manually." });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [addToast]);

    // Auto-detect on mount
    useEffect(() => {
        detectLocation();
    }, [detectLocation]);

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            addToast({ type: "error", title: "Error", message: "Passwords do not match" });
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (!formData.address && (!latitude || !longitude)) {
            setError("Please enter an address or allow GPS location");
            return;
        }

        setIsLoading(true);

        const result = await apiService.register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: "NGO",
            address: formData.address || `GPS: ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`,
            latitude: latitude ?? undefined,
            longitude: longitude ?? undefined,
        });

        if (result.error) {
            setError(result.error);
            addToast({ type: "error", title: "Registration Failed", message: result.error });
        } else {
            addToast({ type: "success", title: "Account Created", message: "Now submit your license details" });

            // Auto-login to get token for step 2
            const loginResult = await apiService.login(formData.email, formData.password);
            if (loginResult.error) {
                addToast({ type: "warning", title: "Login Needed", message: "Please login to submit license details" });
                router.push("/login?registered=true");
            } else {
                setStep(2);
            }
        }
        setIsLoading(false);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        let documentUrl = "";

        // Upload file first if present
        if (licenseFile) {
            setUploadProgress("uploading");
            const uploadResult = await apiService.uploadLicenseFile(licenseFile);
            if (uploadResult.error) {
                setError("Failed to upload license document");
                addToast({ type: "error", title: "Upload Failed", message: uploadResult.error });
                setUploadProgress("error");
                setIsLoading(false);
                return;
            }
            documentUrl = uploadResult.data?.url || "";
            setUploadProgress("done");
        }

        // Submit license
        const result = await apiService.submitNgoLicense({
            license_number: `${licenseData.registrationType}-${licenseData.licenseNumber}`,
            license_expiry: licenseData.licenseExpiry,
            license_document_url: documentUrl || undefined,
        });

        if (result.error) {
            setError(result.error);
            addToast({ type: "error", title: "License Submission Failed", message: result.error });
        } else {
            addToast({ type: "success", title: "Registration Complete!", message: "Your application is pending admin review" });
            router.push("/dashboard/ngo/pending");
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#020617]"></div>
            <div className="bg-nebula-parallax"></div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#fb923c] to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.4)]">
                        <span className="material-symbols-outlined text-white text-2xl">eco</span>
                    </div>
                    <span className="text-2xl font-bold">Surplus</span>
                </Link>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? "bg-[#fb923c] text-slate-900 shadow-[0_0_15px_rgba(251,146,60,0.4)]" : "bg-slate-800 text-slate-500"}`}>1</div>
                        <span className={`text-sm font-medium ${step >= 1 ? "text-white" : "text-slate-500"}`}>Basic Info</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 2 ? "bg-[#fb923c]" : "bg-slate-700"} transition-all`}></div>
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? "bg-[#fb923c] text-slate-900 shadow-[0_0_15px_rgba(251,146,60,0.4)]" : "bg-slate-800 text-slate-500"}`}>2</div>
                        <span className={`text-sm font-medium ${step >= 2 ? "text-white" : "text-slate-500"}`}>License</span>
                    </div>
                </div>

                {/* Card */}
                <div className="glass-card p-8 relative">
                    <div className="glass-highlight"></div>

                    <h1 className="text-2xl font-bold text-center mb-2">
                        {step === 1 ? "Partner Registration" : "License Verification"}
                    </h1>
                    <p className="text-slate-400 text-center mb-6">
                        {step === 1 ? "Register your NGO to start receiving donations" : "Submit your license for verification"}
                    </p>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleStep1Submit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Organization Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="NGO Name" className={inputClass} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@org.com" className={inputClass} required />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} required />
                                </div>
                            </div>

                            {/* Address + GPS */}
                            <div>
                                <label className={labelClass}>
                                    Address
                                    {gpsStatus === "success" && (
                                        <span className="ml-2 text-xs text-green-400 font-normal">
                                            <span className="material-symbols-outlined text-xs align-middle">gps_fixed</span> GPS detected
                                        </span>
                                    )}
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder={gpsStatus === "success" ? `GPS: ${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}` : "123 Main St, City"} className={`${inputClass} flex-1`} />
                                    <button type="button" onClick={detectLocation} className={`px-3 rounded-xl border border-white/10 transition-all flex items-center justify-center ${gpsStatus === "loading" ? "bg-blue-500/20" : gpsStatus === "success" ? "bg-green-500/20" : "bg-slate-800/50 hover:bg-slate-700/50"}`}>
                                        <span className={`material-symbols-outlined text-xl ${gpsStatus === "loading" ? "animate-spin text-blue-400" : gpsStatus === "success" ? "text-green-400" : "text-slate-400"}`}>
                                            {gpsStatus === "loading" ? "sync" : gpsStatus === "success" ? "gps_fixed" : "my_location"}
                                        </span>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Address text or GPS coordinates will be used for delivery location.</p>
                            </div>

                            <div>
                                <label className={labelClass}>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputClass} required minLength={8} />
                                {formData.password && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 flex gap-1">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < pwStrength ? strengthColors[pwStrength - 1] : "bg-slate-700"}`}></div>
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">{strengthLabels[Math.max(0, pwStrength - 1)]}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Confirm Password</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputClass} required />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full h-12 bg-[#fb923c] hover:bg-orange-400 text-slate-900 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(251,146,60,0.3)] hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Continue</span>
                                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={handleStep2Submit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Registration Type</label>
                                <select value={licenseData.registrationType} onChange={(e) => setLicenseData({ ...licenseData, registrationType: e.target.value })} className={inputClass}>
                                    <option value="DARPAN">NGO DARPAN ID</option>
                                    <option value="FCRA">FCRA Registration Number</option>
                                    <option value="TRUST">Trust Registration Number</option>
                                    <option value="SOCIETY">Society Registration Number</option>
                                    <option value="SEC8">Section 8 Company</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>License / Registration Number</label>
                                <div className="flex">
                                    <span className="px-3 py-3 bg-slate-700/50 border border-white/10 border-r-0 rounded-l-xl text-slate-400 text-sm flex items-center">{licenseData.registrationType}-</span>
                                    <input type="text" value={licenseData.licenseNumber} onChange={(e) => setLicenseData({ ...licenseData, licenseNumber: e.target.value })} placeholder="XXXXXXXXXX" className={`${inputClass} rounded-l-none`} required />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>License Expiry Date</label>
                                <input type="date" value={licenseData.licenseExpiry} onChange={(e) => setLicenseData({ ...licenseData, licenseExpiry: e.target.value })} className={inputClass} required min={new Date().toISOString().split("T")[0]} />
                            </div>

                            <div>
                                <label className={labelClass}>Upload License Document</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${licenseFile ? "border-green-500/40 bg-green-500/5" : "border-white/10 hover:border-[#fb923c]/40"}`}>
                                    {licenseFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="material-symbols-outlined text-green-400 text-2xl">description</span>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-white">{licenseFile.name}</p>
                                                <p className="text-xs text-slate-400">{(licenseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button type="button" onClick={() => setLicenseFile(null)} className="ml-2 text-red-400 hover:text-red-300">
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-slate-500 text-3xl mb-2">cloud_upload</span>
                                            <p className="text-sm text-slate-400 mb-2">Drop your license PDF here or</p>
                                            <label className="cursor-pointer text-[#fb923c] hover:text-orange-300 text-sm font-medium">
                                                Browse Files
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && setLicenseFile(e.target.files[0])} />
                                            </label>
                                            <p className="text-xs text-slate-500 mt-2">PDF, JPEG, PNG (max 10MB)</p>
                                        </>
                                    )}
                                </div>
                                {uploadProgress === "uploading" && (
                                    <div className="mt-2 flex items-center gap-2 text-blue-400 text-sm">
                                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                                        Uploading...
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setStep(1); }} className="flex-1 h-12 bg-slate-800/50 border border-white/10 rounded-xl font-bold transition-all hover:bg-slate-700/50 flex items-center justify-center gap-2 text-slate-300">
                                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                                    <span>Back</span>
                                </button>
                                <button type="submit" disabled={isLoading} className="flex-[2] h-12 bg-[#fb923c] hover:bg-orange-400 text-slate-900 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(251,146,60,0.3)] hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Submit Application</span>
                                            <span className="material-symbols-outlined text-xl">check</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-[#fb923c] hover:text-orange-300 font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-2 border-[#fb923c]/30 border-t-[#fb923c] rounded-full animate-spin"></div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
