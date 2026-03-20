<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-primary text-weight-bold">Users</div>
      <q-btn color="primary" text-color="white" icon="person_add" label="Create User" no-caps @click="showCreate = true" />
    </div>

    <!-- Filters -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-4">
        <q-input v-model="search" outlined dense placeholder="Search name or email..." clearable @update:model-value="debouncedFetch">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-6 col-sm-3">
        <q-select v-model="roleFilter" outlined dense clearable :options="roleOptions" label="Role" emit-value map-options @update:model-value="loadUsers" />
      </div>
      <div class="col-6 col-sm-3">
        <q-select v-model="productFilter" outlined dense clearable :options="productOptions" label="Product" emit-value map-options @update:model-value="loadUsers" />
      </div>
    </div>

    <!-- Table -->
    <q-table
      :rows="admin.users"
      :columns="columns"
      row-key="id"
      :loading="admin.loading"
      :pagination="pagination"
      @update:pagination="onPagination"
      @row-click="(_, row) => $router.push(`/admin/users/${row.id}`)"
      flat
      bordered
      class="cursor-pointer"
    >
      <template #body-cell-products="props">
        <q-td :props="props">
          <q-badge
            v-for="sub in props.row.subscriptions"
            :key="sub.id"
            color="amber-8"
            class="q-mr-xs q-mb-xs"
            :label="sub.product"
          />
          <span v-if="!props.row.subscriptions?.length" class="text-grey-5">none</span>
        </q-td>
      </template>
      <template #body-cell-role="props">
        <q-td :props="props">
          <q-badge
            :color="props.row.role === 'OWNER' ? 'deep-purple' : props.row.role === 'ADMIN' ? 'blue' : props.row.role === 'AFFILIATE' ? 'teal' : 'grey'"
            :label="props.row.role"
          />
        </q-td>
      </template>
      <template #body-cell-createdAt="props">
        <q-td :props="props">{{ formatDate(props.row.createdAt) }}</q-td>
      </template>
    </q-table>

    <!-- Create User Dialog -->
    <q-dialog v-model="showCreate">
      <q-card style="min-width: 400px;" class="bee-card">
        <q-card-section>
          <div class="text-h6 text-primary">Create User</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="handleCreate" class="q-gutter-sm">
            <q-input v-model="newUser.name" label="Name" outlined dense :rules="[v => !!v || 'Required']" />
            <q-input v-model="newUser.email" label="Email" type="email" outlined dense :rules="[v => !!v || 'Required']" />
            <q-input v-model="newUser.password" label="Password" type="password" outlined dense :rules="[v => !!v || 'Required']" />
            <q-select v-model="newUser.role" label="Role" outlined dense :options="roleOptions" emit-value map-options />
            <q-card-actions align="right">
              <q-btn flat label="Cancel" @click="showCreate = false" />
              <q-btn type="submit" label="Create" color="primary" text-color="white" :loading="creating" no-caps />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from 'stores/admin'
import { Notify } from 'quasar'

const admin = useAdminStore()

const search = ref('')
const roleFilter = ref<string | null>(null)
const productFilter = ref<string | null>(null)
const showCreate = ref(false)
const creating = ref(false)

const roleOptions = [
  { label: 'Owner', value: 'OWNER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
  { label: 'Affiliate', value: 'AFFILIATE' },
]

const productOptions = [
  { label: 'BeeGraded', value: 'beegraded' },
  { label: 'Pollenz', value: 'pollenz' },
  { label: 'Swarmz', value: 'swarmz' },
  { label: 'Broodz', value: 'broodz' },
  { label: 'BeHivez', value: 'behivez' },
]

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'left' as const, sortable: true },
  { name: 'products', label: 'Products', field: 'subscriptions', align: 'left' as const },
  { name: 'createdAt', label: 'Created', field: 'createdAt', align: 'left' as const, sortable: true },
]

const pagination = ref({ page: 1, rowsPerPage: 20 })

const newUser = reactive({ name: '', email: '', password: '', role: 'USER' })

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadUsers(), 300)
}

function loadUsers() {
  admin.fetchUsers({
    search: search.value || undefined,
    role: roleFilter.value || undefined,
    product: productFilter.value || undefined,
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
  })
}

function onPagination(newPag: { page: number; rowsPerPage: number }) {
  pagination.value = { ...pagination.value, ...newPag }
  loadUsers()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA')
}

async function handleCreate() {
  creating.value = true
  try {
    await admin.createUser({ ...newUser })
    Notify.create({ type: 'positive', message: 'User created' })
    showCreate.value = false
    newUser.name = ''
    newUser.email = ''
    newUser.password = ''
    newUser.role = 'USER'
    loadUsers()
  } catch (e: any) {
    Notify.create({ type: 'negative', message: e.response?.data?.error || 'Failed to create user' })
  } finally {
    creating.value = false
  }
}

onMounted(() => loadUsers())
</script>
