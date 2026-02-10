import { API_BASE_URL, API_ENDPOINTS } from "./api-config";

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

class ApiService {
    private getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem("auth_token");
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = this.getToken();

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                return {
                    error: data?.detail || data?.message || "Request failed",
                    status: response.status,
                };
            }

            return { data, status: response.status };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : "Network error",
                status: 0,
            };
        }
    }

    // Auth
    async login(email: string, password: string) {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.detail || "Login failed", status: response.status };
        }

        localStorage.setItem("auth_token", data.access_token);
        return { data, status: response.status };
    }

    async register(userData: {
        name: string;
        email: string;
        phone: string;
        password: string;
        role: string;
    }) {
        return this.request(API_ENDPOINTS.register, {
            method: "POST",
            body: JSON.stringify(userData),
        });
    }

    async getMe() {
        return this.request<{
            id: string;
            name: string;
            email: string;
            role: string;
        }>(API_ENDPOINTS.me);
    }

    logout() {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
    }

    // Donations
    async getDonations() {
        return this.request<any[]>(API_ENDPOINTS.donations);
    }

    async createDonation(donationData: {
        food_type: string;
        quantity: number;
        pickup_address: string;
        pickup_lat: number;
        pickup_lng: number;
        expiry_time?: string;
        description?: string;
    }) {
        return this.request(API_ENDPOINTS.createDonation, {
            method: "POST",
            body: JSON.stringify(donationData),
        });
    }

    // Volunteers
    async getVolunteers() {
        return this.request<any[]>(API_ENDPOINTS.volunteers);
    }

    async updateVolunteerStatus(isOnline: boolean) {
        return this.request(API_ENDPOINTS.volunteerStatus, {
            method: "PATCH",
            body: JSON.stringify({ is_available: isOnline }),
        });
    }

    async updateVolunteerLocation(lat: number, lng: number) {
        return this.request(API_ENDPOINTS.volunteerLocation, {
            method: "PATCH",
            body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
    }

    // Tasks
    async getTasks() {
        return this.request<any[]>(API_ENDPOINTS.tasks);
    }

    async getTaskById(id: string) {
        return this.request<any>(API_ENDPOINTS.taskById(id));
    }

    async assignTask(taskId: string, volunteerId: string) {
        return this.request(API_ENDPOINTS.assignTask(taskId), {
            method: "POST",
            body: JSON.stringify({ volunteer_id: volunteerId }),
        });
    }

    async completeTask(taskId: string, verificationData?: any) {
        return this.request(API_ENDPOINTS.completeTask(taskId), {
            method: "POST",
            body: JSON.stringify(verificationData || {}),
        });
    }

    // NGO
    async getNgoProfile() {
        return this.request<any>(API_ENDPOINTS.ngoProfile);
    }

    async getNgoDashboard() {
        return this.request<any>(API_ENDPOINTS.ngoDashboard);
    }

    async getNgoNearbyTasks() {
        return this.request<any[]>(API_ENDPOINTS.ngoNearbyTasks);
    }

    async getNgoClaimedTasks() {
        return this.request<any[]>(API_ENDPOINTS.ngoClaimedTasks);
    }

    async claimTask(taskId: string, branchId?: string) {
        return this.request(API_ENDPOINTS.ngoClaimTask(taskId), {
            method: "POST",
            body: JSON.stringify({ branch_id: branchId }),
        });
    }

    // Dispatcher
    async getDispatcherTasks() {
        return this.request<any[]>(API_ENDPOINTS.dispatcherTasks);
    }

    async dispatcherAssignTask(taskId: string, volunteerId: string) {
        return this.request(API_ENDPOINTS.dispatcherAssign(taskId), {
            method: "POST",
            body: JSON.stringify({ volunteer_id: volunteerId }),
        });
    }

    async getDispatcherStats() {
        return this.request<any>(API_ENDPOINTS.dispatcherStats);
    }

    // Admin
    async getAdminUsers() {
        return this.request<any[]>(API_ENDPOINTS.adminUsers);
    }

    async getAdminUserById(id: string) {
        return this.request<any>(API_ENDPOINTS.adminUserById(id));
    }

    async updateUser(id: string, userData: any) {
        return this.request(API_ENDPOINTS.adminUserById(id), {
            method: "PATCH",
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id: string) {
        return this.request(API_ENDPOINTS.adminUserById(id), {
            method: "DELETE",
        });
    }

    async getAdminNgos() {
        return this.request<any[]>(API_ENDPOINTS.adminNgos);
    }

    async approveNgo(id: string) {
        return this.request(API_ENDPOINTS.adminApproveNgo(id), {
            method: "POST",
        });
    }

    async rejectNgo(id: string, reason?: string) {
        return this.request(API_ENDPOINTS.adminRejectNgo(id), {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
    }

    async getAdminStats() {
        return this.request<{
            users: { total: number; volunteers: number; ngos: number; donors: number };
            volunteers: { online: number; busy: number; offline: number };
            ngos: { pending: number; approved: number; rejected: number };
            tasks: { total: number; pending: number; assigned: number; in_progress: number; completed: number; cancelled: number; this_week: number };
        }>(API_ENDPOINTS.adminStats);
    }

    async getAdminDonations() {
        return this.request<any[]>(API_ENDPOINTS.adminDonations);
    }
}

export const apiService = new ApiService();
