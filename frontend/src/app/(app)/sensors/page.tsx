"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { SearchBar } from "@/components/tables/SearchBar";
import { sensorColumns } from "@/features/sensors/columns";
import { RoleGuard } from "@/features/auth/guards/RoleGuard";
import { UserRole, SensorStatus, SensorType } from "@/types/enums";
import { useSensors } from "@/features/sensors/hooks";
import { getSites } from "@/services/sites.service";
import {
  createSensor,
  updateSensor,
  deleteSensor,
} from "@/services/sensors.service";
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
import { SENSOR_TYPE_LABELS } from "@/constants/enums";

const sensorFormSchema = z.object({
  siteId: z.string().min(1, "Site assignment is required"),
  sensorCode: z.string().min(2, "Sensor code must be at least 2 characters"),
  name: z.string().min(2, "Sensor name must be at least 2 characters"),
  sensorType: z.nativeEnum(SensorType),
  unit: z.string().min(1, "Measurement unit is required"),
  status: z.nativeEnum(SensorStatus),
  thresholdMin: z.number().optional(),
  thresholdMax: z.number().optional(),
});

type SensorFormValues = z.infer<typeof sensorFormSchema>;

export default function SensorsPage() {
  const {
    data,
    totalCount,
    isLoading,
    search,
    setSearch,
    status,
    setStatus,
    sensorType,
    setSensorType,
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch,
  } = useSensors();

  const [sites, setSites] = useState<MiningSite[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch sites for forms and filters
    getSites({ limit: 100 })
      .then((res) => setSites(res.data))
      .catch((err) => console.error("Error fetching sites:", err));
  }, []);

  const form = useForm<SensorFormValues>({
    resolver: zodResolver(sensorFormSchema),
    defaultValues: {
      siteId: "",
      sensorCode: "",
      name: "",
      sensorType: SensorType.TEMPERATURE,
      unit: "°C",
      status: SensorStatus.ONLINE,
      thresholdMin: undefined,
      thresholdMax: undefined,
    },
  });

  // Automatically update unit placeholder when type changes
  const watchedType = form.watch("sensorType");
  useEffect(() => {
    if (!selectedSensor) {
      switch (watchedType) {
        case SensorType.TEMPERATURE:
          form.setValue("unit", "°C");
          break;
        case SensorType.PRESSURE:
          form.setValue("unit", "kPa");
          break;
        case SensorType.VIBRATION:
          form.setValue("unit", "mm/s");
          break;
        case SensorType.AIR_QUALITY:
          form.setValue("unit", "ppm");
          break;
        case SensorType.HUMIDITY:
          form.setValue("unit", "%");
          break;
      }
    }
  }, [watchedType, form, selectedSensor]);

  const handleCreateClick = () => {
    setSelectedSensor(null);
    form.reset({
      siteId: sites[0]?.id || "",
      sensorCode: "",
      name: "",
      sensorType: SensorType.TEMPERATURE,
      unit: "°C",
      status: SensorStatus.ONLINE,
      thresholdMin: 0,
      thresholdMax: 100,
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (sensor: any) => {
    setSelectedSensor(sensor);
    form.reset({
      siteId: sensor.siteId,
      sensorCode: sensor.sensorCode,
      name: sensor.name,
      sensorType: sensor.sensorType,
      unit: sensor.unit,
      status: sensor.status,
      thresholdMin: sensor.thresholdMin || 0,
      thresholdMax: sensor.thresholdMax || 100,
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (sensor: any) => {
    setSelectedSensor(sensor);
    setIsDeleteOpen(true);
  };

  const onSubmit = async (values: SensorFormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedSensor) {
        await updateSensor(selectedSensor.id, values);
        toast.success("Sensor updated successfully");
      } else {
        await createSensor(values);
        toast.success("Sensor created successfully");
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Error occurred saving sensor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSensor) return;
    setIsSubmitting(true);
    try {
      await deleteSensor(selectedSensor.id);
      toast.success("Sensor deleted successfully");
      setIsDeleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete sensor.",
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
        UserRole.SAFETY_OFFICER,
      ]}
    >
      <div className="space-y-6">
        <PageHeader
          title="IoT Sensors"
          subtitle="Monitor all site telemetry sensors in real time"
          actions={
            <Button
              size="sm"
              onClick={handleCreateClick}
              id="create-sensor-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Sensor
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            placeholder="Search sensors…"
            value={search}
            onChange={setSearch}
            className="w-72"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status || "all"}
              onValueChange={(val) =>
                setStatus(val === "all" ? undefined : (val as SensorStatus))
              }
            >
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(SensorStatus).map((statusVal) => (
                  <SelectItem key={statusVal} value={statusVal}>
                    {statusVal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sensorType || "all"}
              onValueChange={(val) =>
                setSensorType(val === "all" ? undefined : (val as SensorType))
              }
            >
              <SelectTrigger className="w-[160px] bg-card">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(SENSOR_TYPE_LABELS).map(([k, v]) => (
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
          columns={sensorColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No sensors found"
          emptyDescription="Add sensors to your mining sites to enable real-time telemetry."
          meta={{
            onEdit: handleEditClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Create / Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedSensor ? "Edit Sensor" : "Add Telemetry Sensor"}
              </DialogTitle>
              <DialogDescription>
                {selectedSensor
                  ? "Update the telemetry bounds and parameters for this sensor."
                  : "Register a new telemetry node on a shaft site."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="sensorCode">Sensor Code</Label>
                  <Input
                    id="sensorCode"
                    {...form.register("sensorCode")}
                    placeholder="E.g., TEMP-101"
                  />
                  {form.formState.errors.sensorCode && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.sensorCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Sensor Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="E.g., Shaft 1 Vent Temp"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="sensorType">Sensor Type</Label>
                  <Select
                    value={form.watch("sensorType")}
                    onValueChange={(val) =>
                      form.setValue("sensorType", val! as SensorType)
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SENSOR_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <Input id="unit" {...form.register("unit")} />
                  {form.formState.errors.unit && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.unit.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(val) =>
                      form.setValue("status", val! as SensorStatus)
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SensorStatus).map((statusVal) => (
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
                      <SelectValue placeholder="Select Shaft Site" />
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

              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                <div className="space-y-1">
                  <Label htmlFor="thresholdMin">Warning Min Bound</Label>
                  <Input
                    id="thresholdMin"
                    type="number"
                    step="any"
                    {...form.register("thresholdMin", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="thresholdMax">Warning Max Bound</Label>
                  <Input
                    id="thresholdMax"
                    type="number"
                    step="any"
                    {...form.register("thresholdMax", { valueAsNumber: true })}
                  />
                </div>
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
                  {isSubmitting ? "Saving..." : "Save Sensor"}
                </Button>
              </DialogFooter>
            </form>
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
                  {selectedSensor?.name}
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
