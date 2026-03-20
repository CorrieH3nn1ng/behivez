<template>
  <q-page class="q-pa-md">
    <q-btn flat icon="arrow_back" label="Back to Users" class="q-mb-md text-amber-9" no-caps to="/admin/users" />

    <div v-if="admin.loading && !admin.selectedUser" class="text-center q-pa-xl">
      <q-spinner-dots size="40px" color="amber-9" />
    </div>

    <template v-if="user">
      <!-- User Info Card -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 text-amber-10">User Details</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="editName" label="Name" outlined dense />
            </div>
            <div class="col-12 col-sm-6">
              <q-input :model-value="user.email" label="Email" outlined dense readonly />
            </div>
            <div class="col-12 col-sm-6">
              <q-select v-model="editRole" label="Role" outlined dense :options="roleOptions" emit-value map-options />
            </div>
            <div class="col-12 col-sm-6">
              <q-input :model-value="formatDate(user.createdAt)" label="Created" outlined dense readonly />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Save Changes" color="amber-9" text-color="white" no-caps :loading="saving" @click="saveUser" />
        </q-card-actions>
      </q-card>

      <!-- Subscriptions -->
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="text-h6 text-amber-10">Subscriptions</div>
            <q-btn color="amber-9" text-color="white" icon="add" label="Add" no-caps size="sm" @click="openSubDialog()" />
          </div>
        </q-card-section>
        <q-card-section>
          <q-table
            :rows="user.subscriptions || []"
            :columns="subColumns"
            row-key="id"
            flat
            bordered
            hide-bottom
          >
            <template #body-cell-actions="props">
              <q-td :props="props">
                <q-btn flat dense icon="edit" size="sm" @click="openSubDialog(props.row)" />
                <q-btn flat dense icon="delete" size="sm" color="red" @click="removeSub(props.row.id)" />
              </q-td>
            </template>
          </q-table>
          <div v-if="!user.subscriptions?.length" class="text-grey-6 q-pa-sm">No subscriptions</div>
        </q-card-section>
      </q-card>
    </template>

    <!-- Subscription Dialog -->
    <q-dialog v-model="subDialog">
      <q-card style="min-width: 380px;">
        <q-card-section>
          <div class="text-h6">{{ editingSub ? 'Edit' : 'Add' }} Subscription</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-select v-model="subForm.product" label="Product" outlined dense :options="productOptions" emit-value map-options :disable="!!editingSub" />
          <q-input v-model="subForm.plan" label="Plan" outlined dense placeholder="e.g. free, pro, enterprise" />
          <q-select v-model="subForm.status" label="Status" outlined dense :options="statusOptions" emit-value map-options />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="subDialog = false" />
          <q-btn label="Save" color="amber-9" text-color="white" no-caps :loading="subSaving" @click="saveSub" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore, type Subscription } from 'stores/admin'
import { Notify } from 'quasar'

const route = useRoute()
const admin = useAdminStore()

const userId = computed(() => route.params.id as string)
const user = computed(() => admin.selectedUser)

const editName = ref('')
const editRole = ref('')
const saving = ref(false)

const subDialog = ref(false)
const subSaving = ref(false)
const editingSub = ref<Subscription | null>(null)
const subForm = reactive({ product: '', plan: '', status: 'active' })

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

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Trial', value: 'trial' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Cancelled', value: 'cancelled' },
]

const subColumns = [
  { name: 'product', label: 'Product', field: 'product', align: 'left' as const },
  { name: 'plan', label: 'Plan', field: 'plan', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA')
}

async function loadUser() {
  const data = await admin.fetchUser(userId.value)
  editName.value = data.name
  editRole.value = data.role
}

async function saveUser() {
  saving.value = true
  try {
    await admin.updateUser(userId.value, { name: editName.value, role: editRole.value })
    Notify.create({ type: 'positive', message: 'User updated' })
  } catch (e: any) {
    Notify.create({ type: 'negative', message: e.response?.data?.error || 'Update failed' })
  } finally {
    saving.value = false
  }
}

function openSubDialog(sub?: Subscription) {
  editingSub.value = sub || null
  subForm.product = sub?.product || ''
  subForm.plan = sub?.plan || ''
  subForm.status = sub?.status || 'active'
  subDialog.value = true
}

async function saveSub() {
  subSaving.value = true
  try {
    if (editingSub.value) {
      await admin.updateSubscription(userId.value, editingSub.value.id, {
        plan: subForm.plan,
        status: subForm.status,
      })
    } else {
      await admin.addSubscription(userId.value, {
        product: subForm.product,
        plan: subForm.plan,
        status: subForm.status,
      })
    }
    Notify.create({ type: 'positive', message: 'Subscription saved' })
    subDialog.value = false
    loadUser()
  } catch (e: any) {
    Notify.create({ type: 'negative', message: e.response?.data?.error || 'Failed' })
  } finally {
    subSaving.value = false
  }
}

async function removeSub(subId: string) {
  try {
    await admin.deleteSubscription(userId.value, subId)
    Notify.create({ type: 'positive', message: 'Subscription removed' })
  } catch (e: any) {
    Notify.create({ type: 'negative', message: e.response?.data?.error || 'Failed' })
  }
}

onMounted(() => loadUser())
</script>
