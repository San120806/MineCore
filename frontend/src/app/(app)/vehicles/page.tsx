'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, AlertTriangle, Settings } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { SearchBar } from '@/components/tables/SearchBar';
import { vehicleColumns } from '@/features/vehicles/columns';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole, VehicleStatus, VehicleType } from '@/types/enums';
import { useVehicles } from '@/features/vehicles/hooks';
import { getSites } from '@/services/sites.service';
import { createVehicle, updateVehicle, updateVehicleStatus, deleteVehicle } from '@/services/vehicles.service';
import type { MiningSite } from '@/types/site';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { VEHICLE_TYPE_LABELS } from '@/constants/enums';

const vehicleFormSchema = z.object({
  siteId: z.string().min(1, 'Site is required'),
  vehicleCode: z.string().min(2, 'Vehicle code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  serialNumber: z.string().min(2, 'Serial number must be at least 2 characters'),
  type: z.nativeEnum(VehicleType),
  status: z.nativeEnum(VehicleStatus),
  fuelLevel: z.number().min(0).max(100).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  lastLocation: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function VehiclesPage() {
  const {
    data,
    totalCount,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    type,
    setType,
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch,
  } = useVehicles();

  const [sites, setSites] = useState<MiningSite[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState<VehicleStatus>(VehicleStatus.ACTIVE);

  useEffect(() => {
    // Fetch sites for forms and filters
    getSites({ limit: 100 })
      .then((res) => setSites(res.data))
      .catch((err) => console.error('Error fetching sites:', err));
  }, []);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      siteId: '',
      vehicleCode: '',
      name: '',
      model: '',
      serialNumber: '',
      type: VehicleType.DUMP_TRUCK,
      status: VehicleStatus.ACTIVE,
      fuelLevel: 100,
      batteryLevel: 100,
      lastLocation: '',
    },
  });

  const handleCreateClick = () => {
    setSelectedVehicle(null);
    form.reset({
      siteId: sites[0]?.id || '',
      vehicleCode: '',
      name: '',
      model: '',
      serialNumber: '',
      type: VehicleType.DUMP_TRUCK,
      status: VehicleStatus.ACTIVE,
      fuelLevel: 100,
      batteryLevel: 100,
      lastLocation: '',
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.reset({
      siteId: vehicle.siteId,
      vehicleCode: vehicle.vehicleCode,
      name: vehicle.name,
      model: vehicle.model,
      serialNumber: vehicle.serialNumber,
      type: vehicle.type,
      status: vehicle.status,
      fuelLevel: vehicle.fuelLevel,
      batteryLevel: vehicle.batteryLevel || 100,
      lastLocation: vehicle.lastLocation || '',
    });
    setIsFormOpen(true);
  };

  const handleChangeStatusClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setNewStatus(vehicle.status);
    setIsStatusOpen(true);
  };

  const handleDeleteClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (values: VehicleFormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedVehicle) {
        await updateVehicle(selectedVehicle.id, values);
        toast.success('Vehicle updated successfully');
      } else {
        await createVehicle(values);
        toast.success('Vehicle registered successfully');
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Error occurred saving vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    try {
      await updateVehicleStatus(selectedVehicle.id, newStatus);
      toast.success('Vehicle status updated successfully');
      setIsStatusOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update vehicle status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    try {
      await deleteVehicle(selectedVehicle.id);
      toast.success('Vehicle deleted successfully');
      setIsDeleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.SAFETY_OFFICER, UserRole.MAINTENANCE_ENGINEER]}>
      <div className="space-y-6">
        <PageHeader
          title="Fleet Management"
          subtitle="Track and manage all mining vehicles across sites"
          actions={
            <Button size="sm" onClick={handleCreateClick} id="create-vehicle-btn">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Vehicle
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search vehicles…"
            value={search}
            onChange={setSearch}
            className="w-72"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status || 'all'}
              onValueChange={(val) => setStatus(val === 'all' ? undefined : (val as VehicleStatus))}
            >
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(VehicleStatus).map((statusVal) => (
                  <SelectItem key={statusVal} value={statusVal}>
                    {statusVal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={type || 'all'}
              onValueChange={(val) => setType(val === 'all' ? undefined : (val as VehicleType))}
            >
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={siteId || 'all'}
              onValueChange={(val) => setSiteId(val === 'all' || !val ? undefined : val)}
            >
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={vehicleColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No vehicles found"
          emptyDescription="Add your first vehicle to start tracking the fleet."
          meta={{
            onEdit: handleEditClick,
            onChangeStatus: handleChangeStatusClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Create / Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}</DialogTitle>
              <DialogDescription>
                {selectedVehicle ? 'Update fleet vehicle details.' : 'Add a new vehicle shaft assignment.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="vehicleCode">Vehicle Code</Label>
                  <Input id="vehicleCode" {...form.register('vehicleCode')} placeholder="E.g., TRK-001" />
                  {form.formState.errors.vehicleCode && (
                    <p className="text-xs text-destructive">{form.formState.errors.vehicleCode.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...form.register('name')} placeholder="E.g., Cat 797F" />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" {...form.register('model')} placeholder="Caterpillar 797" />
                  {form.formState.errors.model && (
                    <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" {...form.register('serialNumber')} placeholder="CAT797XXXXX" />
                  {form.formState.errors.serialNumber && (
                    <p className="text-xs text-destructive">{form.formState.errors.serialNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select
                    value={form.watch('type')}
                    onValueChange={(val) => form.setValue('type', val! as VehicleType)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VEHICLE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(val) => form.setValue('status', val! as VehicleStatus)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(VehicleStatus).map((statusVal) => (
                        <SelectItem key={statusVal} value={statusVal}>
                          {statusVal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="siteId">Assigned Site</Label>
                <Select
                  value={form.watch('siteId')}
                  onValueChange={(val) => form.setValue('siteId', val!)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Select Mining Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.siteId && (
                  <p className="text-xs text-destructive">{form.formState.errors.siteId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
                  <Input id="fuelLevel" type="number" {...form.register('fuelLevel', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                  <Input id="batteryLevel" type="number" {...form.register('batteryLevel', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="lastLocation">Last Location Details</Label>
                <Input id="lastLocation" {...form.register('lastLocation')} placeholder="Shaft 2 Upper Deck" />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription>
                Modify operational state of <span className="font-semibold text-foreground">{selectedVehicle?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="statusSelect">Select Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(val) => setNewStatus(val as VehicleStatus)}
                >
                  <SelectTrigger className="w-full bg-card" id="statusSelect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleStatus).map((statusVal) => (
                      <SelectItem key={statusVal} value={statusVal}>
                        {statusVal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsStatusOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Vehicle Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="w-5 h-5" />
                <DialogTitle>Confirm Delete</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{selectedVehicle?.name}</span>?
                This action will delete the vehicle record permanently.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
