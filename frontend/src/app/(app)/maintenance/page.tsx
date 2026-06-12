'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, AlertTriangle, CheckSquare } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { SearchBar } from '@/components/tables/SearchBar';
import { maintenanceColumns } from '@/features/maintenance/columns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole, MaintenanceStatus, MaintenanceType } from '@/types/enums';
import { useMaintenance } from '@/features/maintenance/hooks';
import { getEquipmentList } from '@/services/equipment.service';
import { createMaintenance, updateMaintenance, completeMaintenance, deleteMaintenance } from '@/services/maintenance.service';
import type { Equipment } from '@/types/equipment';
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
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { MAINTENANCE_TYPE_LABELS } from '@/constants/enums';

const maintenanceFormSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment selection is required'),
  issue: z.string().min(3, 'Explain the issue to be addressed (min 3 chars)'),
  maintenanceDate: z.string().min(1, 'Date is required'),
  type: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus),
  scheduledAt: z.string().optional().nullable(),
  notes: z.string().optional(),
  cost: z.number().min(0).optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export default function MaintenancePage() {
  const { user } = useAuthContext();
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
    equipmentId,
    setEquipmentId,
    page,
    setPage,
    pageSize,
    refetch,
  } = useMaintenance();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Complete Maintenance Fields
  const [actionTaken, setActionTaken] = useState('');
  const [finalCost, setFinalCost] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    getEquipmentList({ limit: 100 })
      .then((res) => setEquipmentList(res.data))
      .catch((err) => console.error('Error loading equipment list:', err));
  }, []);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      equipmentId: '',
      issue: '',
      maintenanceDate: new Date().toISOString().substring(0, 10),
      type: MaintenanceType.PREVENTIVE,
      status: MaintenanceStatus.SCHEDULED,
      scheduledAt: '',
      notes: '',
      cost: 0,
    },
  });

  const handleCreateClick = () => {
    setSelectedRecord(null);
    form.reset({
      equipmentId: equipmentList[0]?.id || '',
      issue: '',
      maintenanceDate: new Date().toISOString().substring(0, 10),
      type: MaintenanceType.PREVENTIVE,
      status: MaintenanceStatus.SCHEDULED,
      scheduledAt: '',
      notes: '',
      cost: 0,
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (record: any) => {
    setSelectedRecord(record);
    form.reset({
      equipmentId: record.equipmentId,
      issue: record.issue,
      maintenanceDate: record.maintenanceDate ? new Date(record.maintenanceDate).toISOString().substring(0, 10) : '',
      type: record.type,
      status: record.status,
      scheduledAt: record.scheduledAt ? new Date(record.scheduledAt).toISOString().substring(0, 10) : '',
      notes: record.notes || '',
      cost: record.cost || 0,
    });
    setIsFormOpen(true);
  };

  const handleCompleteClick = (record: any) => {
    setSelectedRecord(record);
    setActionTaken('');
    setFinalCost(record.cost || 0);
    setCompletionNotes(record.notes || '');
    setIsCompleteOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true);
    const payload = {
      ...values,
      performedById: user?.id,
      maintenanceDate: new Date(values.maintenanceDate).toISOString(),
      scheduledAt: values.scheduledAt
        ? new Date(values.scheduledAt).toISOString()
        : undefined,
      cost: values.cost || 0,
    };
    try {
      if (selectedRecord) {
        await updateMaintenance(selectedRecord.id, payload);
        toast.success('Maintenance details updated successfully');
      } else {
        await createMaintenance(payload);
        toast.success('Maintenance scheduled successfully');
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Error occurred saving log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await completeMaintenance(selectedRecord.id, {
        actionTaken,
        cost: finalCost,
        notes: completionNotes,
      });
      toast.success('Maintenance logged as completed successfully');
      setIsCompleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to complete maintenance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      await deleteMaintenance(selectedRecord.id);
      toast.success('Maintenance record deleted');
      setIsDeleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete maintenance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.MAINTENANCE_ENGINEER]}>
      <div className="space-y-6">
        <PageHeader
          title="Maintenance Records"
          subtitle="Track preventive, corrective, and emergency maintenance activities"
          actions={
            <Button size="sm" onClick={handleCreateClick} id="create-maintenance-btn">
              <Plus className="w-4 h-4 mr-1.5" />
              Log Maintenance
            </Button>
          }
        />

        <Tabs
          value={status || 'all'}
          onValueChange={(val) => setStatus(val === 'all' ? undefined : (val.toUpperCase().replace('-', '_') as MaintenanceStatus))}
          className="w-full"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap bg-muted/20 p-1 rounded-lg">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="all" className="text-xs">All Records</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-xs">Scheduled</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select
                value={type || 'all'}
                onValueChange={(val) => setType(val === 'all' ? undefined : (val as MaintenanceType))}
              >
                <SelectTrigger className="w-[150px] bg-card text-xs h-9">
                  <SelectValue placeholder="Filter Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={equipmentId || 'all'}
                onValueChange={(val) => setEquipmentId(val === 'all' || !val ? undefined : val)}
              >
                <SelectTrigger className="w-[180px] bg-card text-xs h-9">
                  <SelectValue placeholder="All Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipmentList.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <SearchBar
                placeholder="Search maintenance…"
                value={search}
                onChange={setSearch}
                className="w-64 h-9 text-xs"
              />
            </div>
          </div>
        </Tabs>

        <DataTable
          columns={maintenanceColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No maintenance records found"
          emptyDescription="Log a scheduled or urgent maintenance job to start tracking operations."
          meta={{
            onEdit: handleEditClick,
            onComplete: handleCompleteClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Log Maintenance Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRecord ? 'Edit Maintenance Log' : 'Log Maintenance Event'}</DialogTitle>
              <DialogDescription>
                {selectedRecord ? 'Update maintenance event details.' : 'Submit a scheduled or active equipment repair request.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="equipmentId">Equipment Asset</Label>
                <Select
                  value={form.watch('equipmentId')}
                  onValueChange={(val) => form.setValue('equipmentId', val!)}
                >
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Select Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentList.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.equipmentId && (
                  <p className="text-xs text-destructive">{form.formState.errors.equipmentId.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="issue">Issue Description</Label>
                <Input id="issue" {...form.register('issue')} placeholder="E.g., Hydraulic hose leak" />
                {form.formState.errors.issue && (
                  <p className="text-xs text-destructive">{form.formState.errors.issue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="type">Maintenance Type</Label>
                  <Select
                    value={form.watch('type')}
                    onValueChange={(val) => form.setValue('type', val! as MaintenanceType)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(val) => form.setValue('status', val! as MaintenanceStatus)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MaintenanceStatus).map((statusVal) => (
                        <SelectItem key={statusVal} value={statusVal}>
                          {statusVal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="maintenanceDate">Maintenance Date</Label>
                  <Input id="maintenanceDate" type="date" {...form.register('maintenanceDate')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="scheduledAt">Scheduled Date (Optional)</Label>
                  <Input id="scheduledAt" type="date" {...form.register('scheduledAt')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cost">Estimated Cost ($)</Label>
                  <Input id="cost" type="number" {...form.register('cost', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes">Notes / Observations</Label>
                <Input id="notes" {...form.register('notes')} placeholder="Add technician diagnostic remarks..." />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Complete Repair Dialog */}
        <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                Complete Maintenance Task
              </DialogTitle>
              <DialogDescription>
                Close out the service log for <span className="font-semibold text-foreground">{selectedRecord?.equipment?.name}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Input
                  id="actionTaken"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="E.g., Replaced hydraulic hose, refilled hydraulic fluid."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="finalCost">Final Cost ($)</Label>
                <Input
                  id="finalCost"
                  type="number"
                  value={finalCost}
                  onChange={(e) => setFinalCost(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="completionNotes">Resolution Notes (Optional)</Label>
                <Input
                  id="completionNotes"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Calibration values, inspection notes..."
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCompleteOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCompleteSubmit} disabled={isSubmitting || !actionTaken.trim()}>
                {isSubmitting ? 'Submitting...' : 'Complete Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="w-5 h-5" />
                <DialogTitle>Confirm Delete</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to delete this maintenance record? This action cannot be undone.
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
