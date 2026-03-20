<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5 q-mr-md">Travel Expenses</div>
      <q-space />
      <q-btn flat icon="print" label="Print" size="sm" @click="printPage" />
    </div>

    <!-- Top Actions -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn color="primary" icon="add" label="Add Vehicle" unelevated @click="showAddVehicle = true" />
      <q-space />
    </div>

    <!-- Unassigned Trips Banner -->
    <q-banner v-if="unassignedCount > 0" class="bg-warning text-white q-mb-md" rounded dense>
      <template v-slot:avatar><q-icon name="warning" /></template>
      {{ unassignedCount }} trips have no vehicle assigned
      <template v-slot:action>
        <q-btn flat label="Bulk Assign" no-caps dense @click="showBulkAssign = true" />
      </template>
    </q-banner>

    <!-- Loading -->
    <div v-if="vehiclesLoading" class="text-center q-pa-xl">
      <q-spinner size="40px" color="primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="vehicles.length === 0" class="text-center q-pa-xl text-grey-6">
      <q-icon name="directions_car" size="48px" class="q-mb-md" />
      <div class="text-subtitle1">No vehicles configured</div>
      <div class="text-caption q-mb-md">Add your vehicle to start tracking travel expenses</div>
    </div>

    <!-- Vehicle Cards -->
    <template v-else>
      <q-card
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        flat
        bordered
        class="q-mb-md"
      >
        <q-card-section>
          <!-- Vehicle Header (clickable to detail page) -->
          <div class="row items-center q-mb-sm cursor-pointer" @click="$router.push(`/vehicle/${vehicle.id}`)">
            <q-icon
              :name="vehicle.type === 'owned' ? 'directions_car' : 'car_rental'"
              :color="vehicle.type === 'owned' ? 'primary' : 'orange'"
              size="sm"
              class="q-mr-sm"
            />
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">
                {{ vehicle.name }}
                <q-badge v-if="vehicle.is_default" color="primary" label="Default" class="q-ml-sm" />
                <q-icon name="chevron_right" size="xs" color="grey" class="q-ml-xs" />
              </div>
              <div class="text-caption text-grey">
                {{ vehicle.type === 'owned' ? 'Owned' : 'Rental' }}
                <template v-if="vehicle.make"> &middot; {{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}</template>
                <template v-if="vehicle.registration"> &middot; {{ vehicle.registration }}</template>
              </div>
            </div>
            <q-btn flat round icon="more_vert" size="sm">
              <q-menu>
                <q-list dense style="min-width: 160px">
                  <q-item clickable v-close-popup @click="editVehicle(vehicle)">
                    <q-item-section avatar><q-icon name="edit" size="sm" /></q-item-section>
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-item v-if="!vehicle.is_default" clickable v-close-popup @click="doSetDefault(vehicle.id)">
                    <q-item-section avatar><q-icon name="star" size="sm" /></q-item-section>
                    <q-item-section>Set Default</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="doSyncKm(vehicle.id)">
                    <q-item-section avatar><q-icon name="sync" size="sm" /></q-item-section>
                    <q-item-section>Sync KM</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="doDeleteVehicle(vehicle.id)" class="text-negative">
                    <q-item-section avatar><q-icon name="delete" size="sm" color="negative" /></q-item-section>
                    <q-item-section>Remove</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <!-- Stats -->
          <div class="row q-col-gutter-sm text-center q-mt-sm">
            <div class="col-3">
              <div class="text-caption text-grey">Trips</div>
              <div class="text-weight-bold">{{ vehicle.trips_count }}</div>
            </div>
            <div class="col-3">
              <div class="text-caption text-grey">Total KM</div>
              <div class="text-weight-bold">{{ fmt(vehicle.total_km_year) }}</div>
            </div>
            <div class="col-3">
              <div class="text-caption text-grey">Business %</div>
              <div class="text-weight-bold">{{ vehicle.business_use_percent.toFixed(1) }}%</div>
            </div>
            <div class="col-3">
              <div class="text-caption text-grey">Opening Odo</div>
              <div class="text-weight-bold">{{ vehicle.opening_odometer.toLocaleString() }}</div>
            </div>
          </div>

          <!-- Deduction / Rental info -->
          <div v-if="vehicle.type === 'owned' && vehicle.calculation" class="q-mt-sm q-pa-sm bg-green-1 rounded-borders">
            <div class="row justify-between text-body2">
              <span class="text-grey-7">SARS Deduction</span>
              <span class="text-weight-bold text-positive">R {{ fmtMoney(vehicle.calculation.annual_deduction) }}</span>
            </div>
          </div>
          <div v-if="vehicle.type === 'rental' && vehicle.rental_total" class="q-mt-sm q-pa-sm bg-orange-1 rounded-borders">
            <div class="row justify-between text-body2">
              <span class="text-grey-7">Rental Total</span>
              <span class="text-weight-bold text-orange">R {{ fmtMoney(vehicle.rental_total) }}</span>
            </div>
          </div>
          <div v-if="vehicle.expenses_sum_amount > 0" class="q-mt-xs q-pa-sm bg-grey-2 rounded-borders">
            <div class="row justify-between text-body2">
              <span class="text-grey-7">Total Expenses</span>
              <span class="text-weight-bold">R {{ fmtMoney(vehicle.expenses_sum_amount) }}</span>
            </div>
          </div>

          <!-- Action Bar -->
          <div class="row q-gutter-sm q-mt-md">
            <q-btn
              :color="expandedSections[vehicle.id]?.trips ? 'primary' : 'grey-7'"
              :outline="!expandedSections[vehicle.id]?.trips"
              :flat="expandedSections[vehicle.id]?.trips"
              icon="route"
              label="Trips"
              no-caps
              dense
              size="sm"
              @click="toggleSection(vehicle.id, 'trips')"
            />
            <q-btn
              :color="expandedSections[vehicle.id]?.expenses ? 'primary' : 'grey-7'"
              :outline="!expandedSections[vehicle.id]?.expenses"
              :flat="expandedSections[vehicle.id]?.expenses"
              icon="receipt_long"
              label="Expenses"
              no-caps
              dense
              size="sm"
              @click="toggleSection(vehicle.id, 'expenses')"
            />
            <q-space />
            <q-btn outline color="primary" icon="add" label="Trip" size="sm" no-caps dense @click="openAddTrip(vehicle.id)" />
            <q-btn outline color="primary" icon="add" label="Expense" size="sm" no-caps dense @click="openAddExpense(vehicle.id)" />
            <q-btn outline color="primary" icon="camera_alt" size="sm" dense @click="openScanReceipt(vehicle.id)" title="Scan Receipt" />
          </div>

          <!-- Trips Section (collapsible) -->
          <q-slide-transition>
            <div v-if="expandedSections[vehicle.id]?.trips" class="q-mt-md">
              <q-separator class="q-mb-sm" />

              <!-- Filters Row -->
              <div class="row items-center q-gutter-sm q-mb-sm">
                <q-btn-toggle
                  :model-value="vTripCategory[vehicle.id] || ''"
                  toggle-color="primary"
                  :options="[
                    { label: 'All', value: '' },
                    { label: 'Business', value: 'Business' },
                    { label: 'Private', value: 'Private' },
                  ]"
                  unelevated size="sm"
                  @update:model-value="(val: string) => switchVehicleTripCategory(vehicle.id, val)"
                />
                <q-input
                  :model-value="vTripSearch[vehicle.id] || ''"
                  @update:model-value="(val: string | number | null) => { vTripSearch[vehicle.id] = String(val || ''); }"
                  dense outlined placeholder="Search..." clearable style="min-width: 140px" size="sm"
                >
                  <template v-slot:prepend><q-icon name="search" size="xs" /></template>
                </q-input>
              </div>

              <!-- Loading -->
              <div v-if="vTripsLoading[vehicle.id]" class="text-center q-pa-md">
                <q-spinner size="30px" color="primary" />
              </div>

              <template v-else-if="vTripsData[vehicle.id]">
                <!-- Summary Cards -->
                <div v-if="vTripsData[vehicle.id].summary" class="row q-col-gutter-sm q-mb-sm">
                  <div class="col-4">
                    <q-card flat bordered>
                      <q-card-section class="q-pa-xs text-center">
                        <div class="text-caption text-grey-7">Trips</div>
                        <div class="text-subtitle1 text-weight-bold">{{ vTripsData[vehicle.id].summary.total_trips }}</div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card flat bordered>
                      <q-card-section class="q-pa-xs text-center">
                        <div class="text-caption text-grey-7">Distance</div>
                        <div class="text-subtitle1 text-weight-bold">{{ fmt(vTripsData[vehicle.id].summary.total_km) }} km</div>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-4">
                    <q-card flat bordered class="bg-green-1">
                      <q-card-section class="q-pa-xs text-center">
                        <div class="text-caption text-positive">Business</div>
                        <div class="text-subtitle1 text-weight-bold text-positive">{{ fmt(vTripsData[vehicle.id].summary.business_km) }} km</div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <!-- Trips Table -->
                <q-card v-if="filteredVehicleTrips(vehicle.id).length > 0" flat bordered>
                  <q-table
                    :rows="filteredVehicleTrips(vehicle.id)"
                    :columns="tripColumns"
                    row-key="id"
                    flat dense
                    :pagination="{ sortBy: 'date', descending: true, rowsPerPage: 25 }"
                    :rows-per-page-options="[25, 50, 100, 0]"
                  >
                    <template #body-cell-category="props">
                      <q-td :props="props">
                        <q-badge :color="props.row.category === 'Business' ? 'green' : 'grey'" :label="props.row.category" />
                      </q-td>
                    </template>
                    <template #body-cell-distance_km="props">
                      <q-td :props="props" class="text-right">
                        {{ fmt(props.row.distance_km) }}
                      </q-td>
                    </template>
                    <template #body-cell-odo_reading="props">
                      <q-td :props="props" class="text-right">
                        <template v-if="props.row.odometer_end">
                          <span class="text-weight-bold">{{ props.row.odometer_end.toLocaleString() }}</span>
                        </template>
                        <template v-else>
                          <span class="text-grey-6">{{ props.row._running_odo.toLocaleString() }}</span>
                        </template>
                      </q-td>
                    </template>
                    <template #body-cell-actions="props">
                      <q-td :props="props">
                        <q-btn flat dense icon="edit" size="sm" @click="editTrip(props.row)" />
                        <q-btn flat dense icon="delete" size="sm" color="red" @click="confirmDeleteTrip(props.row)" />
                      </q-td>
                    </template>
                  </q-table>
                </q-card>

                <div v-else class="text-center q-pa-md text-grey-6">
                  <div class="text-caption">No trips recorded</div>
                </div>
              </template>
            </div>
          </q-slide-transition>

          <!-- Expenses Section (collapsible) -->
          <q-slide-transition>
            <div v-if="expandedSections[vehicle.id]?.expenses" class="q-mt-md">
              <q-separator class="q-mb-sm" />

              <!-- Loading -->
              <div v-if="vExpensesLoading[vehicle.id]" class="text-center q-pa-md">
                <q-spinner size="30px" color="primary" />
              </div>

              <template v-else>
                <!-- Summary -->
                <q-card v-if="vExpenseSummaries[vehicle.id]" flat bordered class="q-mb-sm">
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center q-gutter-md">
                      <div>
                        <div class="text-caption text-grey-7">Total Expenses</div>
                        <div class="text-h6">R {{ fmtMoney(vExpenseSummaries[vehicle.id]!.grand_total) }}</div>
                      </div>
                      <template v-if="vExpenseSummaries[vehicle.id]?.by_category">
                        <div v-for="(val, cat) in vExpenseSummaries[vehicle.id]!.by_category" :key="cat" class="q-ml-md">
                          <div class="text-caption text-grey-7">{{ cat }}</div>
                          <div class="text-subtitle2">R {{ fmtMoney(val.total) }} <span class="text-caption text-grey">({{ val.count }})</span></div>
                        </div>
                      </template>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Expense Table -->
                <div v-if="(vExpensesList[vehicle.id] || []).length === 0" class="text-center q-pa-md text-grey-6">
                  <div class="text-caption">No expenses recorded</div>
                </div>

                <q-card v-else flat bordered>
                  <q-table
                    :rows="vExpensesList[vehicle.id] || []"
                    :columns="expenseColumns"
                    row-key="id"
                    flat dense
                    :pagination="{ sortBy: 'date', descending: true, rowsPerPage: 25 }"
                    :rows-per-page-options="[25, 50, 100, 0]"
                  >
                    <template #body-cell-category="props">
                      <q-td :props="props">
                        <q-icon :name="catIcon(props.row.category)" :color="catColor(props.row.category)" size="xs" class="q-mr-xs" />
                        <span class="text-weight-medium">{{ props.row.category }}</span>
                        <q-badge v-if="props.row.source === 'ai_extracted'" color="purple" label="AI" class="q-ml-xs" dense />
                      </q-td>
                    </template>
                    <template #body-cell-amount="props">
                      <q-td :props="props" class="text-right">
                        <span class="text-weight-bold text-primary">R {{ fmtMoney(props.row.amount) }}</span>
                      </q-td>
                    </template>
                    <template #body-cell-fuel_info="props">
                      <q-td :props="props">
                        <template v-if="props.row.litres">
                          {{ props.row.litres }}L @ R{{ props.row.price_per_litre }}/L
                        </template>
                        <span v-else class="text-grey-5">—</span>
                      </q-td>
                    </template>
                    <template #body-cell-actions="props">
                      <q-td :props="props">
                        <q-btn flat dense icon="edit" size="sm" @click="editExpense(props.row)" />
                        <q-btn flat dense icon="delete" size="sm" color="red" @click="doDeleteExpense(props.row.id, vehicle.id)" />
                      </q-td>
                    </template>
                  </q-table>
                </q-card>
              </template>
            </div>
          </q-slide-transition>
        </q-card-section>
      </q-card>
    </template>

    <!-- ================================ -->
    <!-- ADD/EDIT VEHICLE DIALOG -->
    <!-- ================================ -->
    <q-dialog v-model="showAddVehicle" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingVehicleId ? 'Edit Vehicle' : 'Add Vehicle' }}</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-btn-toggle
            v-model="vForm.type"
            toggle-color="primary"
            :options="[{ label: 'Owned', value: 'owned' }, { label: 'Rental', value: 'rental' }]"
            unelevated spread
          />
          <q-input v-model="vForm.name" label="Vehicle Name *" dense outlined placeholder="e.g. Renault Duster" />
          <div class="row q-gutter-sm">
            <q-input v-model="vForm.make" label="Make" dense outlined class="col" />
            <q-input v-model="vForm.model" label="Model" dense outlined class="col" />
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model.number="vForm.year" label="Year" dense outlined type="number" class="col" />
            <q-input v-model="vForm.registration" label="Registration" dense outlined class="col" />
          </div>
          <q-input v-model.number="vForm.opening_odometer" label="Opening Odometer (km)" dense outlined type="number" hint="Speedo reading when you started logging trips" />
          <template v-if="vForm.type === 'owned'">
            <q-separator />
            <q-input v-model.number="vForm.purchase_price" label="Purchase Price (R)" dense outlined type="number" />
            <q-input v-model="vForm.purchase_date" label="Purchase Date" dense outlined type="date" />
          </template>
          <template v-if="vForm.type === 'rental'">
            <q-separator />
            <div class="row q-gutter-sm">
              <q-input v-model="vForm.rental_start" label="Start" dense outlined type="date" class="col" />
              <q-input v-model="vForm.rental_end" label="End" dense outlined type="date" class="col" />
            </div>
            <q-input v-model.number="vForm.rental_total" label="Total Rental Cost (R)" dense outlined type="number" />
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelVehicleDialog" />
          <q-btn color="primary" :label="editingVehicleId ? 'Update' : 'Add'" @click="saveVehicle" :loading="vehicleSaving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================ -->
    <!-- ADD/EDIT TRIP DIALOG -->
    <!-- ================================ -->
    <q-dialog v-model="showTripDialog" persistent>
      <q-card style="min-width: 380px">
        <q-card-section>
          <div class="text-h6">{{ editingTrip ? 'Edit Trip' : 'Add Trip' }}</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-select v-model="tForm.vehicle_id" :options="vehicleSelectOpts" emit-value map-options dense outlined label="Vehicle" />
          <q-input v-model="tForm.date" type="date" label="Date" dense outlined />
          <q-input v-model="tForm.origin" label="From" dense outlined />
          <q-input v-model="tForm.destination" label="To" dense outlined />
          <q-input v-model.number="tForm.distance_km" type="number" label="Distance (km)" dense outlined step="0.1" />
          <div class="row q-gutter-sm">
            <q-input v-model.number="tForm.odometer_start" type="number" label="Odo Start" dense outlined class="col" />
            <q-input v-model.number="tForm.odometer_end" type="number" label="Odo End" dense outlined class="col" />
          </div>
          <q-input v-model="tForm.purpose" label="Purpose" dense outlined />
          <q-select v-model="tForm.category" :options="['Business', 'Private']" label="Category" dense outlined />
          <div class="row q-gutter-sm">
            <q-input v-model="tForm.start_time" type="time" label="Depart" dense outlined class="col" />
            <q-input v-model="tForm.end_time" type="time" label="Arrive" dense outlined class="col" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelTripDialog" />
          <q-btn color="primary" :label="editingTrip ? 'Update' : 'Add'" @click="saveTrip" :loading="tripSaving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ================================ -->
    <!-- ADD/EDIT EXPENSE DIALOG -->
    <!-- ================================ -->
    <q-dialog v-model="showAddExpense" persistent>
      <q-card style="min-width: 380px">
        <q-card-section>
          <div class="text-h6">{{ editingExpenseId ? 'Edit Expense' : 'Add Expense' }}</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-select v-model="eForm.vehicle_id" :options="vehicleSelectOpts" emit-value map-options dense outlined label="Vehicle *" />
          <q-input v-model="eForm.date" type="date" label="Date *" dense outlined />
          <q-select v-model="eForm.category" :options="expCats" dense outlined label="Category *" />
          <q-input v-model.number="eForm.amount" type="number" label="Amount (R) *" dense outlined step="0.01" />
          <q-input v-model="eForm.vendor" label="Vendor / Station" dense outlined />
          <q-input v-model="eForm.description" label="Description" dense outlined type="textarea" rows="2" />
          <template v-if="eForm.category === 'Fuel'">
            <q-separator />
            <div class="row q-gutter-sm">
              <q-input v-model.number="eForm.litres" type="number" label="Litres" dense outlined step="0.01" class="col" />
              <q-input v-model.number="eForm.price_per_litre" type="number" label="R/Litre" dense outlined step="0.01" class="col" />
            </div>
            <q-input v-model.number="eForm.odometer_km" type="number" label="Odometer (km)" dense outlined />
          </template>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelExpenseDialog" />
          <q-btn color="primary" :label="editingExpenseId ? 'Update' : 'Add'" @click="saveExpense" :loading="expenseSaving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- SCAN RECEIPT DIALOG -->
    <q-dialog v-model="showScanReceipt" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Scan Receipt</div>
        </q-card-section>
        <q-card-section class="column q-gutter-sm">
          <q-select v-model="scanVehicleId" :options="vehicleSelectOpts" emit-value map-options dense outlined label="Vehicle *" />
          <q-file v-model="scanFile" outlined label="Photo or PDF" accept="image/*,application/pdf" :max-file-size="10485760">
            <template v-slot:prepend><q-icon name="camera_alt" /></template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Upload" :disable="!scanFile || !scanVehicleId" :loading="scanUploading" @click="uploadReceipt" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- BULK ASSIGN DIALOG -->
    <q-dialog v-model="showBulkAssign">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Bulk Assign Trips</div>
          <div class="text-caption text-grey q-mb-md">Assign {{ unassignedCount }} unassigned trips to a vehicle</div>
          <q-select v-model="bulkVehicleId" :options="vehicleSelectOpts" emit-value map-options dense outlined label="Vehicle" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Assign All" :disable="!bulkVehicleId" :loading="bulkAssigning" @click="doBulkAssign" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { vehiclesApi, type Vehicle } from '@/services/api/vehicles.api';
import { vehicleExpensesApi, type VehicleExpense, type ExpenseSummary, EXPENSE_CATEGORIES } from '@/services/api/vehicle-expenses.api';
import { tripsApi, type Trip, type TripSummary } from '@/services/api/trips.api';

const $q = useQuasar();

// =========================================
// State
// =========================================

// Vehicles
const vehicles = ref<Vehicle[]>([]);
const vehiclesLoading = ref(true);
const showAddVehicle = ref(false);
const editingVehicleId = ref<string | null>(null);
const vehicleSaving = ref(false);
const vForm = ref(emptyVehicleForm());

// Per-vehicle expandable sections
const expandedSections = reactive<Record<string, { trips: boolean; expenses: boolean }>>({});

// Per-vehicle trip data
const vTripsData = reactive<Record<string, { data: Trip[]; summary: TripSummary }>>({});
const vTripCategory = reactive<Record<string, string>>({});
const vTripSearch = reactive<Record<string, string>>({});
const vTripsLoading = reactive<Record<string, boolean>>({});

// Per-vehicle expense data
const vExpensesList = reactive<Record<string, VehicleExpense[]>>({});
const vExpenseSummaries = reactive<Record<string, ExpenseSummary | null>>({});
const vExpensesLoading = reactive<Record<string, boolean>>({});

// Unassigned trips
const unassignedCount = ref(0);
const showBulkAssign = ref(false);
const bulkVehicleId = ref<string | null>(null);
const bulkAssigning = ref(false);

// Trip dialog
const showTripDialog = ref(false);
const editingTrip = ref<Trip | null>(null);
const tripSaving = ref(false);
const contextVehicleId = ref<string | null>(null);
const tForm = ref(emptyTripForm());

// Expense dialog
const showAddExpense = ref(false);
const editingExpenseId = ref<string | null>(null);
const expenseSaving = ref(false);
const eForm = ref(emptyExpenseForm());

// Scan
const showScanReceipt = ref(false);
const scanVehicleId = ref<string | null>(null);
const scanFile = ref<File | null>(null);
const scanUploading = ref(false);

// =========================================
// Computed
// =========================================
const expCats = EXPENSE_CATEGORIES as unknown as string[];

const vehicleSelectOpts = computed(() =>
  vehicles.value.map(v => ({ label: `${v.name}${v.is_default ? ' (Default)' : ''}`, value: v.id }))
);

const tripColumns = [
  { name: 'date', label: 'Date', field: 'date', sortable: true, align: 'left' as const },
  { name: 'origin', label: 'From', field: 'origin', sortable: true, align: 'left' as const },
  { name: 'destination', label: 'To', field: 'destination', sortable: true, align: 'left' as const },
  { name: 'distance_km', label: 'KM', field: 'distance_km', sortable: true, align: 'right' as const },
  { name: 'odo_reading', label: 'Odo Reading', field: '_running_odo', sortable: true, align: 'right' as const },
  { name: 'purpose', label: 'Purpose', field: 'purpose', sortable: true, align: 'left' as const },
  { name: 'category', label: 'Type', field: 'category', sortable: true, align: 'center' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
];

const expenseColumns = [
  { name: 'date', label: 'Date', field: (row: VehicleExpense) => row.date?.substring(0, 10), sortable: true, align: 'left' as const },
  { name: 'category', label: 'Category', field: 'category', sortable: true, align: 'left' as const },
  { name: 'vendor', label: 'Vendor', field: 'vendor', sortable: true, align: 'left' as const },
  { name: 'fuel_info', label: 'Fuel Details', field: 'litres', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amount', sortable: true, align: 'right' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
];

// =========================================
// Formatters
// =========================================
function fmt(n: number) { return n.toLocaleString('en-ZA', { maximumFractionDigits: 1 }); }
function fmtMoney(n: number) { return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function printPage() { window.print(); }

function catIcon(c: string) {
  const m: Record<string, string> = { Fuel: 'local_gas_station', Service: 'build', Tyres: 'tire_repair', Insurance: 'shield', Toll: 'toll', Licence: 'badge', Parking: 'local_parking' };
  return m[c] || 'receipt';
}
function catColor(c: string) {
  const m: Record<string, string> = { Fuel: 'orange', Service: 'blue', Tyres: 'brown', Insurance: 'purple', Toll: 'teal', Licence: 'cyan', Parking: 'indigo' };
  return m[c] || 'grey';
}

// =========================================
// Form defaults
// =========================================
function emptyVehicleForm() {
  return { type: 'owned' as 'owned' | 'rental', name: '', make: '', model: '', year: new Date().getFullYear(), registration: '', purchase_price: 0, purchase_date: '', opening_odometer: 0, rental_start: '', rental_end: '', rental_total: 0 };
}
function emptyTripForm() {
  return { vehicle_id: '', date: new Date().toISOString().substring(0, 10), origin: '', destination: '', distance_km: 0, odometer_start: null as number | null, odometer_end: null as number | null, purpose: '', category: 'Business' as 'Business' | 'Private', start_time: '', end_time: '' };
}
function emptyExpenseForm() {
  return { vehicle_id: '', date: new Date().toISOString().substring(0, 10), category: 'Fuel', amount: 0, vendor: '', description: '', litres: null as number | null, price_per_litre: null as number | null, odometer_km: null as number | null };
}

// =========================================
// Per-vehicle trips with running odometer
// =========================================
function computeTripsWithOdo(vehicleId: string, tripsData: Trip[]): (Trip & { _running_odo: number })[] {
  if (!tripsData.length) return [];

  const vehicle = vehicles.value.find(v => v.id === vehicleId);
  const openingOdo = vehicle?.opening_odometer ?? 0;

  const oldest = [...tripsData].reverse();
  let running = openingOdo;

  const withOdo = oldest.map(t => {
    if (t.odometer_end) {
      running = t.odometer_end;
    } else {
      running += t.distance_km;
    }
    return { ...t, _running_odo: Math.round(running) };
  });

  return withOdo.reverse();
}

function filteredVehicleTrips(vehicleId: string): (Trip & { _running_odo: number })[] {
  const data = vTripsData[vehicleId];
  if (!data) return [];

  let trips = computeTripsWithOdo(vehicleId, data.data);

  const cat = vTripCategory[vehicleId];
  if (cat) trips = trips.filter(t => t.category === cat);

  const q = (vTripSearch[vehicleId] || '').toLowerCase();
  if (q) {
    trips = trips.filter(t =>
      t.origin?.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q) ||
      t.purpose?.toLowerCase().includes(q) ||
      t.date?.includes(q)
    );
  }

  return trips;
}

// =========================================
// Section Toggle & Lazy Loading
// =========================================
function toggleSection(vehicleId: string, section: 'trips' | 'expenses') {
  if (!expandedSections[vehicleId]) {
    expandedSections[vehicleId] = { trips: false, expenses: false };
  }

  const isExpanding = !expandedSections[vehicleId][section];
  expandedSections[vehicleId][section] = isExpanding;

  if (isExpanding) {
    if (section === 'trips' && !vTripsData[vehicleId]) {
      loadVehicleTrips(vehicleId);
    }
    if (section === 'expenses' && !vExpensesList[vehicleId]) {
      loadVehicleExpenses(vehicleId);
    }
  }
}

async function loadVehicleTrips(vehicleId: string) {
  vTripsLoading[vehicleId] = true;
  try {
    const res = await tripsApi.list({ vehicle_id: vehicleId });
    vTripsData[vehicleId] = { data: res.data.data, summary: res.data.summary };
    // Count unassigned from full trip list (only once)
    if (unassignedCount.value === 0) {
      const allRes = await tripsApi.list();
      unassignedCount.value = allRes.data.data.filter(t => !t.vehicle_id).length;
    }
  } catch (e) {
    console.error('Failed to load trips for vehicle', e);
  } finally {
    vTripsLoading[vehicleId] = false;
  }
}

function switchVehicleTripCategory(vehicleId: string, category: string) {
  vTripCategory[vehicleId] = category;
  // Client-side filter — no reload needed since we fetch all trips for the vehicle
}

async function loadVehicleExpenses(vehicleId: string) {
  vExpensesLoading[vehicleId] = true;
  try {
    const [expRes, sumRes] = await Promise.all([
      vehicleExpensesApi.list({ vehicle_id: vehicleId }),
      vehicleExpensesApi.summary(vehicleId),
    ]);
    vExpensesList[vehicleId] = expRes.data.data;
    vExpenseSummaries[vehicleId] = sumRes.data;
  } catch (e) {
    console.error('Failed to load expenses for vehicle', e);
  } finally {
    vExpensesLoading[vehicleId] = false;
  }
}

// =========================================
// Context-aware dialog openers
// =========================================
function openAddTrip(vehicleId: string) {
  contextVehicleId.value = vehicleId;
  tForm.value = emptyTripForm();
  tForm.value.vehicle_id = vehicleId;
  showTripDialog.value = true;
}

function openAddExpense(vehicleId: string) {
  contextVehicleId.value = vehicleId;
  eForm.value = emptyExpenseForm();
  eForm.value.vehicle_id = vehicleId;
  showAddExpense.value = true;
}

function openScanReceipt(vehicleId: string) {
  scanVehicleId.value = vehicleId;
  scanFile.value = null;
  showScanReceipt.value = true;
}

// =========================================
// Vehicles CRUD
// =========================================
async function loadVehicles() {
  vehiclesLoading.value = true;
  try {
    const res = await vehiclesApi.list();
    vehicles.value = res.data.data;
    for (const v of vehicles.value) {
      if (v.type === 'owned') {
        try {
          const detail = await vehiclesApi.show(v.id);
          v.calculation = detail.data.data.calculation;
        } catch { /* skip */ }
      }
    }
  } catch (e) {
    console.error('Failed to load vehicles', e);
  } finally {
    vehiclesLoading.value = false;
  }
}

function editVehicle(v: Vehicle) {
  editingVehicleId.value = v.id;
  vForm.value = { type: v.type, name: v.name, make: v.make || '', model: v.model || '', year: v.year || new Date().getFullYear(), registration: v.registration || '', purchase_price: v.purchase_price, purchase_date: v.purchase_date || '', opening_odometer: v.opening_odometer, rental_start: v.rental_start || '', rental_end: v.rental_end || '', rental_total: v.rental_total || 0 };
  showAddVehicle.value = true;
}

async function saveVehicle() {
  if (!vForm.value.name) { $q.notify({ type: 'warning', message: 'Name required' }); return; }
  vehicleSaving.value = true;
  try {
    const data: Record<string, unknown> = { ...vForm.value };
    for (const k of Object.keys(data)) { if (data[k] === '') data[k] = null; }
    if (editingVehicleId.value) {
      await vehiclesApi.update(editingVehicleId.value, data as never);
      $q.notify({ type: 'positive', message: 'Vehicle updated' });
    } else {
      await vehiclesApi.create(data as never);
      $q.notify({ type: 'positive', message: 'Vehicle added' });
    }
    cancelVehicleDialog();
    await loadVehicles();
  } catch { $q.notify({ type: 'negative', message: 'Failed to save vehicle' }); }
  finally { vehicleSaving.value = false; }
}

function cancelVehicleDialog() { showAddVehicle.value = false; editingVehicleId.value = null; vForm.value = emptyVehicleForm(); }

async function doSetDefault(id: string) {
  try { await vehiclesApi.setDefault(id); $q.notify({ type: 'positive', message: 'Default set' }); await loadVehicles(); }
  catch { $q.notify({ type: 'negative', message: 'Failed' }); }
}

async function doSyncKm(id: string) {
  try { await vehiclesApi.syncKm(id); $q.notify({ type: 'positive', message: 'KM synced' }); await loadVehicles(); }
  catch { $q.notify({ type: 'negative', message: 'Failed' }); }
}

async function doDeleteVehicle(id: string) {
  $q.dialog({ title: 'Remove Vehicle', message: 'Deactivate this vehicle?', cancel: true }).onOk(async () => {
    try { await vehiclesApi.destroy(id); $q.notify({ type: 'positive', message: 'Removed' }); await loadVehicles(); }
    catch { $q.notify({ type: 'negative', message: 'Failed' }); }
  });
}

// =========================================
// Trips CRUD
// =========================================
function editTrip(trip: Trip) {
  editingTrip.value = trip;
  contextVehicleId.value = trip.vehicle_id || null;
  tForm.value = { vehicle_id: trip.vehicle_id || '', date: trip.date, origin: trip.origin, destination: trip.destination, distance_km: trip.distance_km, odometer_start: trip.odometer_start, odometer_end: trip.odometer_end, purpose: trip.purpose || '', category: trip.category, start_time: trip.start_time || '', end_time: trip.end_time || '' };
  showTripDialog.value = true;
}

async function saveTrip() {
  if (!tForm.value.origin || !tForm.value.destination || !tForm.value.distance_km) {
    $q.notify({ type: 'warning', message: 'Fill required fields' }); return;
  }
  tripSaving.value = true;
  try {
    const data: Record<string, unknown> = { ...tForm.value };
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    data.date = tForm.value.date; data.origin = tForm.value.origin; data.destination = tForm.value.destination;
    data.distance_km = tForm.value.distance_km; data.category = tForm.value.category;

    if (editingTrip.value) {
      await tripsApi.update(editingTrip.value.id, data as never);
      $q.notify({ type: 'positive', message: 'Trip updated' });
    } else {
      await tripsApi.create(data as never);
      $q.notify({ type: 'positive', message: 'Trip added' });
    }

    const affectedVehicleId = tForm.value.vehicle_id;
    cancelTripDialog();

    if (affectedVehicleId && vTripsData[affectedVehicleId]) {
      await loadVehicleTrips(affectedVehicleId);
    }
    await loadVehicles();
  } catch { $q.notify({ type: 'negative', message: 'Failed to save trip' }); }
  finally { tripSaving.value = false; }
}

function cancelTripDialog() { showTripDialog.value = false; editingTrip.value = null; contextVehicleId.value = null; tForm.value = emptyTripForm(); }

function confirmDeleteTrip(trip: Trip) {
  $q.dialog({ title: 'Delete Trip', message: `Delete ${trip.date} ${trip.origin} → ${trip.destination}?`, cancel: true }).onOk(async () => {
    try {
      await tripsApi.delete(trip.id);
      $q.notify({ type: 'positive', message: 'Deleted' });
      if (trip.vehicle_id && vTripsData[trip.vehicle_id]) {
        await loadVehicleTrips(trip.vehicle_id);
      }
      await loadVehicles();
    } catch { $q.notify({ type: 'negative', message: 'Failed' }); }
  });
}

async function doBulkAssign() {
  if (!bulkVehicleId.value) return;
  bulkAssigning.value = true;
  try {
    const res = await vehiclesApi.bulkAssignTrips(bulkVehicleId.value);
    $q.notify({ type: 'positive', message: res.data.message });
    showBulkAssign.value = false;
    unassignedCount.value = 0;
    await loadVehicles();
  } catch { $q.notify({ type: 'negative', message: 'Failed' }); }
  finally { bulkAssigning.value = false; }
}

// =========================================
// Expenses CRUD
// =========================================
function editExpense(exp: VehicleExpense) {
  editingExpenseId.value = exp.id;
  contextVehicleId.value = exp.vehicle_id;
  eForm.value = { vehicle_id: exp.vehicle_id, date: exp.date?.substring(0, 10), category: exp.category, amount: exp.amount, vendor: exp.vendor || '', description: exp.description || '', litres: exp.litres, price_per_litre: exp.price_per_litre, odometer_km: exp.odometer_km };
  showAddExpense.value = true;
}

async function saveExpense() {
  if (!eForm.value.vehicle_id || !eForm.value.date || !eForm.value.category || !eForm.value.amount) {
    $q.notify({ type: 'warning', message: 'Fill required fields' }); return;
  }
  expenseSaving.value = true;
  try {
    const data: Record<string, unknown> = { ...eForm.value };
    for (const k of Object.keys(data)) { if (data[k] === '' || data[k] === null) delete data[k]; }
    data.vehicle_id = eForm.value.vehicle_id; data.date = eForm.value.date;
    data.category = eForm.value.category; data.amount = eForm.value.amount;

    if (editingExpenseId.value) {
      await vehicleExpensesApi.update(editingExpenseId.value, data as never);
      $q.notify({ type: 'positive', message: 'Expense updated' });
    } else {
      await vehicleExpensesApi.create(data as never);
      $q.notify({ type: 'positive', message: 'Expense added' });
    }

    const affectedVehicleId = eForm.value.vehicle_id;
    cancelExpenseDialog();

    if (vExpensesList[affectedVehicleId]) {
      await loadVehicleExpenses(affectedVehicleId);
    }
    await loadVehicles();
  } catch { $q.notify({ type: 'negative', message: 'Failed to save expense' }); }
  finally { expenseSaving.value = false; }
}

function cancelExpenseDialog() { showAddExpense.value = false; editingExpenseId.value = null; contextVehicleId.value = null; eForm.value = emptyExpenseForm(); }

async function doDeleteExpense(id: string, vehicleId: string) {
  $q.dialog({ title: 'Delete Expense', message: 'Are you sure?', cancel: true }).onOk(async () => {
    try {
      await vehicleExpensesApi.destroy(id);
      $q.notify({ type: 'positive', message: 'Deleted' });
      if (vExpensesList[vehicleId]) {
        await loadVehicleExpenses(vehicleId);
      }
      await loadVehicles();
    } catch { $q.notify({ type: 'negative', message: 'Failed' }); }
  });
}

async function uploadReceipt() {
  if (!scanFile.value || !scanVehicleId.value) return;
  scanUploading.value = true;
  try {
    const res = await vehicleExpensesApi.upload(scanVehicleId.value, scanFile.value);
    $q.notify({ type: 'positive', message: 'Uploaded — fill in details' });
    showScanReceipt.value = false;
    scanFile.value = null;
    editExpense(res.data.data);
    const vid = scanVehicleId.value;
    if (vExpensesList[vid]) {
      await loadVehicleExpenses(vid);
    }
  } catch { $q.notify({ type: 'negative', message: 'Upload failed' }); }
  finally { scanUploading.value = false; }
}

// =========================================
// Watchers
// =========================================
watch(showAddVehicle, (val) => { if (!val) cancelVehicleDialog(); });
watch(showTripDialog, (val) => { if (!val) cancelTripDialog(); });
watch(showAddExpense, (val) => { if (!val) cancelExpenseDialog(); });

// =========================================
// Lifecycle
// =========================================
onMounted(async () => {
  await loadVehicles();
  // Check unassigned count
  try {
    const allRes = await tripsApi.list();
    unassignedCount.value = allRes.data.data.filter(t => !t.vehicle_id).length;
  } catch { /* ignore */ }
});
</script>

<style>
@media print {
  .q-header, .q-drawer, .q-btn, .q-page-sticky { display: none !important; }
  .q-page { padding: 0 !important; }
}
</style>
