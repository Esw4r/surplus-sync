// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
    // Auth
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    me: "/api/v1/auth/me",
    refreshToken: "/api/v1/auth/refresh",

    // Donations
    donations: "/api/v1/donations",
    createDonation: "/api/v1/donations",
    donationById: (id: string) => `/api/v1/donations/${id}`,

    // Volunteers
    volunteers: "/api/v1/volunteers/",
    volunteerStatus: "/api/v1/volunteers/status",
    volunteerLocation: "/api/v1/volunteers/location",

    // Tasks
    tasks: "/api/v1/tasks",
    taskById: (id: string) => `/api/v1/tasks/${id}`,
    assignTask: (id: string) => `/api/v1/tasks/${id}/assign`,
    completeTask: (id: string) => `/api/v1/tasks/${id}/complete`,

    // NGO
    ngoProfile: "/api/v1/ngos/profile",
    ngoDashboard: "/api/v1/ngos/dashboard",
    ngoNearbyTasks: "/api/v1/ngos/nearby-tasks",
    ngoClaimedTasks: "/api/v1/ngos/claimed-tasks",
    ngoClaimTask: (id: string) => `/api/v1/ngos/tasks/${id}/claim`,
    ngoSubmitLicense: "/api/v1/ngos/me/license",
    ngoUploadLicense: "/api/v1/ngos/upload-license",
    ngoStatus: "/api/v1/ngos/me/status",

    // Dispatcher
    dispatcherTasks: "/api/v1/dispatcher/tasks",
    dispatcherAssign: (id: string) => `/api/v1/dispatcher/tasks/${id}/assign`,
    dispatcherStats: "/api/v1/dispatcher/stats",
    dispatcherNgos: "/api/v1/dispatcher/ngos",
    dispatcherDonors: "/api/v1/dispatcher/donors",

    // Admin
    adminUsers: "/api/v1/admin/users",
    adminUserById: (id: string) => `/api/v1/admin/users/${id}`,
    adminNgos: "/api/v1/admin/ngos",
    adminApproveNgo: (id: string) => `/api/v1/admin/ngos/${id}/approve`,
    adminRejectNgo: (id: string) => `/api/v1/admin/ngos/${id}/reject`,
    adminRejectNgoWithReason: (id: string) => `/api/v1/admin/ngos/${id}/reject-with-reason`,
    adminExpiringNgos: "/api/v1/admin/ngos/expiring",
    adminStats: "/api/v1/admin/stats",
    adminDonations: "/api/v1/admin/donations",
} as const;

// WebSocket URL
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
