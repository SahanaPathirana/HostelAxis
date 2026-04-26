import axios from "axios";

const TOKEN_KEY = "ha_token";
const USER_KEY = "ha_user";

const api = axios.create({ baseURL: "http://localhost:5000/api", headers: { "Content-Type": "application/json" } });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  publishNotice: (data) => api.post("/admin/notices", data),

  getStudents: () => api.get("/admin/students"),
  verifyStudent: (studentId, status) => api.patch(`/admin/students/${studentId}/verify`, { status }),
  setUserActivation: (userId, active) => api.patch(`/admin/users/${userId}/activation`, { active }),

  getStaff: () => api.get("/admin/staff"),
  createStaff: (data) => api.post("/admin/staff", data),

  getRooms: () => api.get("/admin/rooms"),
  getRoomMap: () => api.get("/admin/rooms/map"),
  addRoom: (data) => api.post("/admin/rooms", data),
  updateRoom: (roomId, data) => api.patch(`/admin/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/admin/rooms/${roomId}`),

  getAvailableBeds: () => api.get("/admin/beds/available"),
  assignBed: (data) => api.post("/admin/beds/assign", data),
  unassignBed: (bedId) => api.delete(`/admin/beds/${bedId}/unassign`),
  getBedHistory: () => api.get("/admin/beds/history"),

  getBedRequests: () => api.get("/admin/bed-requests"),
  approveBedRequest: (id) => api.patch(`/admin/bed-requests/${id}/approve`),
  rejectBedRequest: (id) => api.patch(`/admin/bed-requests/${id}/reject`),

  getFeePlans: () => api.get("/admin/fee-plans"),
  createFeePlan: (data) => api.post("/admin/fee-plans", data),
  updateFeePlan: (id, data) => api.patch(`/admin/fee-plans/${id}`, data),
  deleteFeePlan: (id) => api.delete(`/admin/fee-plans/${id}`),
  resetFeeData: () => api.delete("/admin/fee-plans-and-payments/reset"),

  getPayments: () => api.get("/admin/payments"),
  recordPayment: (data) => api.post("/admin/payments", data),
  getPaymentRequests: () => api.get("/admin/payment-requests"),

  getAllComplaints: () => api.get("/admin/complaints"),
  updateComplaintStatus: (id, status) => api.patch(`/admin/complaints/${id}/status`, { status }),
  assignComplaint: (id, staffId) => api.patch(`/admin/complaints/${id}/assign`, { staffId }),

  getVisitors: () => api.get("/admin/visitors"),
  addVisitor: (data) => api.post("/admin/visitors", data),
  updateVisitor: (id, data) => api.patch(`/admin/visitors/${id}`, data),

  getNotifications: () => api.get("/admin/notifications"),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),

  getConversations: () => api.get("/admin/messages"),
  getThread: (userId) => api.get(`/admin/messages/${userId}`),
  sendMessage: (data) => api.post("/admin/messages", data),
};

export const studentAPI = {
  getProfile: () => api.get("/student/profile"),
  getFeePlans: () => api.get("/student/fee-plans"),
  setCurrentFeePlan: (feePlanId) => api.patch("/student/current-fee-plan", { feePlanId }),
  getComplaints: () => api.get("/student/complaints"),
  submitComplaint: (data) => api.post("/student/complaints", data),
  submitPaymentRequest: (data) => api.post("/student/payment-requests", data),
  getNotifications: () => api.get("/student/notifications"),
  markNotificationRead: (id) => api.patch(`/student/notifications/${id}/read`),

  getRoomMap: () => api.get("/student/rooms/map"),
  getBedRequests: () => api.get("/student/bed-requests"),
  submitBedRequest: (data) => api.post("/student/bed-requests", data),

  getMessages: () => api.get("/student/messages"),
  sendMessage: (message) => api.post("/student/messages", { message }),
};

export const staffAPI = {
  getProfile: () => api.get("/staff/profile"),
  getComplaints: () => api.get("/staff/complaints"),
  markDone: (id) => api.patch(`/staff/complaints/${id}/done`),
  getNotifications: () => api.get("/staff/notifications"),
};

export default api;
