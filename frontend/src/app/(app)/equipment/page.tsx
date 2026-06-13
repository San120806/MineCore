"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertTriangle, Heart } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { SearchBar } from "@/components/tables/SearchBar";
import { equipmentColumns } from "@/features/equipment/columns";
import { RoleGuard } from "@/features/auth/guards/RoleGuard";
import { UserRole, EquipmentStatus, EquipmentType } from "@/types/enums";
import { useEquipment } from "@/features/equipment/hooks";
import { getSites } from "@/services/sites.service";
import {
  getEquipmentList,
  createEquipment,
  updateEquipment,
  updateEquipmentHealth,
  deleteEquipment,
} from "@/services/equipment.service";
import type { MiningSite } from "@/types/site";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EQUIPMENT_TYPE_LABELS } from "@/constants/enums";

const equipmentFormSchema = z.object({
  siteId: z.string().min(1, "Site assignment is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  model: z.string().min(2, "Model must be at least 2 characters"),
  serialNumber: z
    .string()
    .min(2, "Serial number must be at least 2 characters"),
  type: z.nativeEnum(EquipmentType),
  status: z.nativeEnum(EquipmentStatus),
  healthScore: z
    .number()
    .min(0, "Health score must be at least 0")
    .max(100, "Health score cannot exceed 100"),
  nextMaintenanceDate: z.string().optional().nullable(),
  installedAt: z.string().optional().nullable(),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export default function EquipmentPage() {
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
  } = useEquipment();

  const [sites, setSites] = useState<MiningSite[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Health Stats
  const [healthStats, setHealthStats] = useState({
    healthy: 0,
    degraded: 0,
    critical: 0,
  });

  // Slider State
  const [sliderHealth, setSliderHealth] = useState<number>(100);
  const [sliderStatus, setSliderStatus] = useState<EquipmentStatus>(
    EquipmentStatus.OPERATIONAL,
  );

  const fetchStats = useCallback(async () => {
    try {
      const allRes = await getEquipmentList({ limit: 100 });
      const eq = allRes.data || [];
      let h = 0,
        d = 0,
        c = 0;
      eq.forEach((e) => {
        if (e.healthScore >= 70) h++;
        else if (e.healthScore >= 40) d++;
        else c++;
      });
      setHealthStats({ healthy: h, degraded: d, critical: c });
    } catch (err) {
      console.error("Failed to calculate equipment stats:", err);
    }
  }, []);

  useEffect(() => {
    getSites({ limit: 100 })
      .then((res) => setSites(res.data))
      .catch((err) => console.error("Error fetching sites:", err));

    fetchStats();
  }, [fetchStats]);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      siteId: "",
      name: "",
      model: "",
      serialNumber: "",
      type: EquipmentType.CONVEYOR,
      status: EquipmentStatus.OPERATIONAL,
      healthScore: 100,
      nextMaintenanceDate: "",
      installedAt: "",
    },
  });

  const handleCreateClick = () => {
    setSelectedEquipment(null);
    form.reset({
      siteId: sites[0]?.id || "",
      name: "",
      model: "",
      serialNumber: "",
      type: EquipmentType.CONVEYOR,
      status: EquipmentStatus.OPERATIONAL,
      healthScore: 100,
      nextMaintenanceDate: "",
      installedAt: "",
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    form.reset({
      siteId: equipment.siteId,
      name: equipment.name,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      type: equipment.type,
      status: equipment.status,
      healthScore: equipment.healthScore,
      nextMaintenanceDate: equipment.nextMaintenanceDate
        ? new Date(equipment.nextMaintenanceDate).toISOString().substring(0, 10)
        : "",
      installedAt: equipment.installedAt
        ? new Date(equipment.installedAt).toISOString().substring(0, 10)
        : "",
    });
    setIsFormOpen(true);
  };

  const handleUpdateHealthClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setSliderHealth(equipment.healthScore);
    setSliderStatus(equipment.status);
    setIsHealthOpen(true);
  };

  const handleDeleteClick = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (values: EquipmentFormValues) => {
    setIsSubmitting(true);
    // Sanitize dates to valid ISO 8601 format
    const payload = {
      ...values,
      nextMaintenanceDate: values.nextMaintenanceDate
        ? new Date(values.nextMaintenanceDate).toISOString()
        : undefined,
      installedAt: values.installedAt
        ? new Date(values.installedAt).toISOString()
        : undefined,
    };
    try {
      if (selectedEquipment) {
        await updateEquipment(selectedEquipment.id, payload);
        toast.success("Equipment details updated successfully");
      } else {
        await createEquipment(payload);
        toast.success("Equipment registered successfully");
      }
      setIsFormOpen(false);
      refetch();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Error occurred saving equipment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHealthScoreSubmit = async () => {
    if (!selectedEquipment) return;
    setIsSubmitting(true);
    try {
      await updateEquipmentHealth(selectedEquipment.id, {
        healthScore: sliderHealth,
        status: sliderStatus,
      });
      toast.success("Health parameters adjusted successfully");
      setIsHealthOpen(false);
      refetch();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update health score.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedEquipment) return;
    setIsSubmitting(true);
    try {
      await deleteEquipment(selectedEquipment.id);
      toast.success("Equipment record deleted");
      setIsDeleteOpen(false);
      refetch();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete equipment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard
      allowedRoles={[
        UserRole.ADMIN,
        UserRole.OPERATIONS_MANAGER,
        UserRole.MAINTENANCE_ENGINEER,
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="Equipment Monitoring"
          subtitle="Oversee asset status, diagnostic scores, and upcoming maintenance schedules"
          actions={
            <Button
              size="sm"
              onClick={handleCreateClick}
              id="create-equipment-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Equipment
            </Button>
          }
        />

        {/* Health score summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Healthy (≥70)",
              count: healthStats.healthy,
              color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
            },
            {
              label: "Degraded (40–69)",
              count: healthStats.degraded,
              color: "border-amber-500/20 bg-amber-500/5 text-amber-400",
            },
            {
              label: "Critical (<40)",
              count: healthStats.critical,
              color: "border-red-500/20 bg-red-500/5 text-red-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border p-4 flex flex-col justify-between ${item.color}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
                {item.label}
              </p>
              <p className="text-3xl font-bold mt-2 tabular-nums">
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search equipment…"
            value={search}
            onChange={setSearch}
            className="w-72"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status || "all"}
              onValueChange={(val) =>
                setStatus(val === "all" ? undefined : (val as EquipmentStatus))
              }
            >
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(EquipmentStatus).map((statusVal) => (
                  <SelectItem key={statusVal} value={statusVal}>
                    {statusVal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={type || "all"}
              onValueChange={(val) =>
                setType(val === "all" ? undefined : (val as EquipmentType))
              }
            >
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EQUIPMENT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={siteId || "all"}
              onValueChange={(val) =>
                setSiteId(val === "all" || !val ? undefined : val)
              }
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
          columns={equipmentColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No equipment found"
          emptyDescription="Register equipment to start tracking diagnostic bounds and maintenance logs."
          meta={{
            onEdit: handleEditClick,
            onUpdateHealth: handleUpdateHealthClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Create / Edit Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedEquipment
                  ? "Edit Equipment Details"
                  : "Register Equipment Asset"}
              </DialogTitle>
              <DialogDescription>
                {selectedEquipment
                  ? "Update the equipment specs and scheduling limits."
                  : "Register a new heavy equipment asset in the shaft system."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="E.g., Secondary Crusher B"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    {...form.register("model")}
                    placeholder="E.g., Sandvik CH890i"
                  />
                  {form.formState.errors.model && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    {...form.register("serialNumber")}
                    placeholder="SVK890XXXXX"
                  />
                  {form.formState.errors.serialNumber && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.serialNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="type">Equipment Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(val) =>
                      form.setValue("type", val! as EquipmentType)
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EQUIPMENT_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(val) =>
                      form.setValue("status", val! as EquipmentStatus)
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EquipmentStatus).map((statusVal) => (
                        <SelectItem key={statusVal} value={statusVal}>
                          {statusVal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="siteId">Assigned Site</Label>
                  <Select
                    value={form.watch("siteId")}
                    onValueChange={(val) => form.setValue("siteId", val!)}
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Select Shaft" />
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
                    <p className="text-xs text-destructive">
                      {form.formState.errors.siteId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="healthScore">Health Score (0-100)</Label>
                  <Input
                    id="healthScore"
                    type="number"
                    {...form.register("healthScore", { valueAsNumber: true })}
                  />
                  {form.formState.errors.healthScore && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.healthScore.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="installedAt">Installed Date</Label>
                  <Input
                    id="installedAt"
                    type="date"
                    {...form.register("installedAt")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="nextMaintenanceDate">
                  Next Scheduled Maintenance
                </Label>
                <Input
                  id="nextMaintenanceDate"
                  type="date"
                  {...form.register("nextMaintenanceDate")}
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Asset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Health Score Dialog */}
        <Dialog open={isHealthOpen} onOpenChange={setIsHealthOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-rose-500" />
                Adjust Equipment Health Score
              </DialogTitle>
              <DialogDescription>
                Perform manual calibration of health score and state for{" "}
                <span className="font-semibold text-foreground">
                  {selectedEquipment?.name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Health Score</Label>
                  <span className="font-bold tabular-nums">
                    {sliderHealth}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderHealth}
                  onChange={(e) => setSliderHealth(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthStatusSelect">
                  Equipment Status Override
                </Label>
                <Select
                  value={sliderStatus}
                  onValueChange={(val) =>
                    setSliderStatus(val as EquipmentStatus)
                  }
                >
                  <SelectTrigger
                    className="w-full bg-card"
                    id="healthStatusSelect"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EquipmentStatus).map((statusVal) => (
                      <SelectItem key={statusVal} value={statusVal}>
                        {statusVal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsHealthOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleHealthScoreSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Health"}
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
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {selectedEquipment?.name}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
