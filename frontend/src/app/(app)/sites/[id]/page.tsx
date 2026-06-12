'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowLeft, Edit, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole, SiteStatus } from '@/types/enums';
import { getSite, updateSite } from '@/services/sites.service';
import { getVehicles } from '@/services/vehicles.service';
import { getSensors } from '@/services/sensors.service';
import type { MiningSite } from '@/types/site';
import type { Vehicle } from '@/types/vehicle';
import type { Sensor } from '@/types/sensor';
import { DataTable } from '@/components/tables/DataTable';
import { vehicleColumns } from '@/features/vehicles/columns';
import { sensorColumns } from '@/features/sensors/columns';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

interface SiteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SiteDetailPage({ params }: SiteDetailPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [site, setSite] = useState<MiningSite | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [siteData, vehiclesData, sensorsData] = await Promise.all([
        getSite(id),
        getVehicles({ siteId: id, limit: 50 }),
        getSensors({ siteId: id, limit: 50 }),
      ]);
      setSite(siteData);
      setVehicles(vehiclesData.data);
      setSensors(sensorsData.data);

      form.reset({
        name: siteData.name,
        location: siteData.location,
        coordinates: siteData.coordinates || '',
        status: siteData.status,
        areaSqKm: siteData.areaSqKm || undefined,
        workerCount: siteData.workerCount || 0,
        managerName: siteData.managerName || '',
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve site details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onSubmit = async (values: SiteFormValues) => {
    setIsSubmitting(true);
    try {
      await updateSite(id, values);
      toast.success('Site updated successfully');
      setIsFormOpen(false);
      fetchDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save site.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Link href={ROUTES.SITES} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sites
        </Link>
        <div className="p-4 bg-destructive/15 border border-destructive/30 rounded-lg text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER]}>
      <div className="space-y-6">
        <PageHeader
          title={site ? site.name : 'Loading Site Details...'}
          subtitle={site ? `Location: ${site.location}` : `Site ID: ${id}`}
          actions={
            <div className="flex items-center gap-2">
              <Link href={ROUTES.SITES} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Sites
              </Link>
              {site && (
                <Button size="sm" onClick={() => setIsFormOpen(true)} id="edit-site-btn">
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit Site
                </Button>
              )}
            </div>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 space-y-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/4" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                  <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-12" />
                </div>
              ))}
            </div>
          </div>
        ) : site ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Site Information */}
              <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 space-y-4">
                <p className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Site Information
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                    <p className="font-medium">{site.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                    <p className="font-medium">{site.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Coordinates</p>
                    <p className="font-medium font-mono text-xs">{site.coordinates || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                    <StatusBadge value={site.status} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Area</p>
                    <p className="font-medium">{site.areaSqKm ? `${site.areaSqKm} km²` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Manager</p>
                    <p className="font-medium">{site.managerName || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Assigned Fleet</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                    {vehicles.length}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Assigned Sensors</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                    {sensors.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Data Tabs/Tables */}
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Assigned Fleet ({vehicles.length})</h3>
                <DataTable
                  columns={vehicleColumns}
                  data={vehicles}
                  isLoading={false}
                  emptyTitle="No vehicles assigned"
                  emptyDescription="There are currently no vehicles assigned to this shaft."
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Assigned Sensors ({sensors.length})</h3>
                <DataTable
                  columns={sensorColumns}
                  data={sensors}
                  isLoading={false}
                  emptyTitle="No sensors assigned"
                  emptyDescription="There are currently no telemetry sensors assigned to this shaft."
                />
              </div>
            </div>
          </>
        ) : null}

        {/* Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Mining Site</DialogTitle>
              <DialogDescription>Update the operational parameters of this shaft site.</DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="name">Site Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register('location')} />
                {form.formState.errors.location && (
                  <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="coordinates">Coordinates</Label>
                  <Input id="coordinates" {...form.register('coordinates')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(val) => form.setValue('status', val! as SiteStatus)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
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
                <Input id="managerName" {...form.register('managerName')} />
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
      </div>
    </RoleGuard>
  );
}
