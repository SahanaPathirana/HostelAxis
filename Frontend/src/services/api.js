import axios from "axios";

const TOKEN_KEY = "ha_token";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  getStudents: () => api.get("/admin/students"),
  verifyStudent: (studentId, status) =>
    api.patch(`/admin/students/${studentId}/verify`, { status }),

  getRooms: () => api.get("/admin/rooms"),
  addRoom: (data) => api.post("/admin/rooms", data),
  deleteRoom: (roomId) => api.delete(`/admin/rooms/${roomId}`),

  getAvailableBeds: () => api.get("/admin/beds/available"),
  assignBed: (bedId, studentId) => api.post("/admin/beds/assign", { bedId, studentId }),
  unassignBed: (bedId) => api.delete(`/admin/beds/${bedId}/unassign`),

  getFeePlans: () => api.get("/admin/fee-plans"),
  createFeePlan: (data) => api.post("/admin/fee-plans", data),
  deleteFeePlan: (id) => api.delete(`/admin/fee-plans/${id}`),

  getPayments: () => api.get("/admin/payments"),
  recordPayment: (data) => api.post("/admin/payments", data),

  getAllComplaints: () => api.get("/admin/complaints"),
  updateComplaintStatus: (id, status) =>
    api.patch(`/admin/complaints/${id}/status`, { status }),
};

export const studentAPI = {
  getProfile: () => api.get("/student/profile"),
  getComplaints: () => api.get("/student/complaints"),
  submitComplaint: (data) => api.post("/student/complaints", data),
};

export default api;
