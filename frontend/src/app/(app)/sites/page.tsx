'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { SearchBar } from '@/components/tables/SearchBar';
import { siteColumns } from '@/features/sites/columns';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole, SiteStatus } from '@/types/enums';
import { useSites } from '@/features/sites/hooks';
import { createSite, updateSite, deleteSite } from '@/services/sites.service';
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

const siteFormSchema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  coordinates: z.string().optional(),
  status: z.nativeEnum(SiteStatus),
  areaSqKm: z.number().min(0, 'Area must be positive').optional(),
  workerCount: z.number().int().min(0, 'Worker count must be positive').optional(),
  managerName: z.string().optional(),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

export default function SitesPage() {
  const {
    data,
    totalCount,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    refetch,
  } = useSites();

  // CRUD State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: '',
      location: '',
      coordinates: '',
      status: SiteStatus.ACTIVE,
      areaSqKm: undefined,
      workerCount: 0,
      managerName: '',
    },
  });

  const handleCreateClick = () => {
    setSelectedSite(null);
    form.reset({
      name: '',
      location: '',
      coordinates: '',
      status: SiteStatus.ACTIVE,
      areaSqKm: undefined,
      workerCount: 0,
      managerName: '',
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (site: any) => {
    setSelectedSite(site);
    form.reset({
      name: site.name,
      location: site.location,
      coordinates: site.coordinates || '',
      status: site.status,
      areaSqKm: site.areaSqKm || undefined,
      workerCount: site.workerCount || 0,
      managerName: site.managerName || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (site: any) => {
    setSelectedSite(site);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (values: SiteFormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedSite) {
        await updateSite(selectedSite.id, values);
        toast.success('Site updated successfully');
      } else {
        await createSite(values);
        toast.success('Site created successfully');
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'An error occurred saving the site.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSite) return;
    setIsSubmitting(true);
    try {
      await deleteSite(selectedSite.id);
      toast.success('Site deleted successfully');
      setIsDeleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete site.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER]}>
      <div className="space-y-6">
        <PageHeader
          title="Mining Sites"
          subtitle="Manage and monitor all mining site locations"
          actions={
            <Button size="sm" onClick={handleCreateClick} id="create-site-btn">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Site
            </Button>
          }
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-72">
            <SearchBar
              placeholder="Search sites…"
              value={search}
              onChange={setSearch}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={status || 'all'}
              onValueChange={(val) => setStatus(val === 'all' ? undefined : (val as SiteStatus))}
            >
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(SiteStatus).map((statusVal) => (
                  <SelectItem key={statusVal} value={statusVal}>
                    {statusVal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={siteColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No mining sites found"
          emptyDescription="Create your first mining site to get started."
          meta={{
            onEdit: handleEditClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Site Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSite ? 'Edit Mining Site' : 'Add New Mining Site'}</DialogTitle>
              <DialogDescription>
                {selectedSite
                  ? 'Update the details for this mining site.'
                  : 'Enter the details to register a new operational mining site.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="name">Site Name</Label>
                <Input id="name" {...form.register('name')} placeholder="E.g., North Shaft Pit" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register('location')} placeholder="E.g., Nevada Sector-4" />
                {form.formState.errors.location && (
                  <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="coordinates">Coordinates</Label>
                  <Input id="coordinates" {...form.register('coordinates')} placeholder="40.7128° N, 74.0060° W" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(val) => form.setValue('status', val! as SiteStatus)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SiteStatus).map((statusVal) => (
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
                  <Label htmlFor="areaSqKm">Area (sq km)</Label>
                  <Input id="areaSqKm" type="number" step="any" {...form.register('areaSqKm', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="workerCount">Workers</Label>
                  <Input id="workerCount" type="number" {...form.register('workerCount', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="managerName">Manager Name</Label>
                <Input id="managerName" {...form.register('managerName')} placeholder="E.g., John Doe" />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Site'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Site Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="w-5 h-5" />
                <DialogTitle>Confirm Delete</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{selectedSite?.name}</span>?
                This action is irreversible and all linked resources might be affected.
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
