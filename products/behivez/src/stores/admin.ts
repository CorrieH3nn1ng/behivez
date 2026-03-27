import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const ADMIN_URL = '/admin'

export interface Subscription {
  id: string
  product: string
  plan: string
  status: string
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string
  subscriptions: Subscription[]
}

export interface DashboardStats {
  totalUsers: number
  usersByRole: Record<string, number>
  subscriptionsByProduct: Record<string, number>
  subscriptionsByStatus: { product: string; status: string; count: number }[]
  recentSignups: number
}

export interface HealthCheck {
  name: string
  url: string
  status: 'up' | 'down' | 'degraded'
  statusCode?: number
  responseTime?: number
}

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([])
  const totalUsers = ref(0)
  const selectedUser = ref<AdminUser | null>(null)
  const stats = ref<DashboardStats | null>(null)
  const healthChecks = ref<HealthCheck[]>([])
  const revenue = ref<any>(null)
  const adminPayments = ref<any[]>([])
  const totalPayments = ref(0)
  const loading = ref(false)
  const healthLoading = ref(false)

  async function fetchUsers(params?: { search?: string; role?: string; product?: string; page?: number; limit?: number }) {
    loading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/users`, { params })
      users.value = data.users || data
      totalUsers.value = data.total ?? users.value.length
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: string) {
    loading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/users/${id}`)
      selectedUser.value = data
      return data as AdminUser
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: string, payload: { name?: string; role?: string }) {
    const { data } = await axios.patch(`${ADMIN_URL}/users/${id}`, payload)
    selectedUser.value = data
    return data as AdminUser
  }

  async function createUser(payload: { name: string; email: string; password: string; role?: string }) {
    const { data } = await axios.post(`${ADMIN_URL}/users`, payload)
    return data as AdminUser
  }

  async function addSubscription(userId: string, payload: { product: string; plan: string; status?: string }) {
    const { data } = await axios.post(`${ADMIN_URL}/users/${userId}/subscriptions`, payload)
    if (selectedUser.value?.id === userId) {
      await fetchUser(userId)
    }
    return data
  }

  async function updateSubscription(userId: string, subId: string, payload: { plan?: string; status?: string }) {
    const { data } = await axios.patch(`${ADMIN_URL}/users/${userId}/subscriptions/${subId}`, payload)
    if (selectedUser.value?.id === userId) {
      await fetchUser(userId)
    }
    return data
  }

  async function deleteSubscription(userId: string, subId: string) {
    await axios.delete(`${ADMIN_URL}/users/${userId}/subscriptions/${subId}`)
    if (selectedUser.value?.id === userId) {
      await fetchUser(userId)
    }
  }

  async function fetchStats() {
    loading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/stats`)
      stats.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchRevenue() {
    loading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/revenue`)
      revenue.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchPayments(params?: { page?: number; limit?: number; product?: string; status?: string }) {
    loading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/payments`, { params })
      adminPayments.value = data.payments || []
      totalPayments.value = data.total ?? 0
    } finally {
      loading.value = false
    }
  }

  async function fetchHealth() {
    healthLoading.value = true
    try {
      const { data } = await axios.get(`${ADMIN_URL}/health`)
      healthChecks.value = Array.isArray(data) ? data : data.checks || []
    } finally {
      healthLoading.value = false
    }
  }

  return {
    users,
    totalUsers,
    selectedUser,
    stats,
    healthChecks,
    revenue,
    adminPayments,
    totalPayments,
    loading,
    healthLoading,
    fetchUsers,
    fetchUser,
    updateUser,
    createUser,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    fetchStats,
    fetchRevenue,
    fetchPayments,
    fetchHealth,
  }
})
