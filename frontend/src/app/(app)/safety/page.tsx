"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, AlertTriangle, CheckSquare } from "lucide-react";
import { DataTable } from "@/components/tables/DataTable";
import { SearchBar } from "@/components/tables/SearchBar";
import { alertColumns } from "@/features/alerts/columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGuard } from "@/features/auth/guards/RoleGuard";
import { UserRole, AlertSeverity, AlertStatus } from "@/types/enums";
import { useAlerts } from "@/features/alerts/hooks";
import { getSites } from "@/services/sites.service";
import {
  createAlert,
  acknowledgeAlert,
  resolveAlert,
  deleteAlert,
} from "@/services/alerts.service";
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
import { useAuthContext } from "@/features/auth/context/AuthContext";

const alertFormSchema = z.object({
  siteId: z.string().min(1, "Site assignment is required"),
  title: z.string().min(2, "Alert title must be at least 2 characters"),
  description: z
    .string()
    .min(5, "Provide a description of the safety issue (min 5 chars)"),
  severity: z.nativeEnum(AlertSeverity),
  location: z.string().optional(),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

export default function SafetyPage() {
  const { user } = useAuthContext();
  const {
    data,
    totalCount,
    isLoading,
    search,
    setSearch,
    severity,
    setSeverity,
    status,
    setStatus,
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch,
  } = useAlerts();

  const [sites, setSites] = useState<MiningSite[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    getSites({ limit: 100 })
      .then((res) => setSites(res.data))
      .catch((err) => console.error("Error fetching sites:", err));
  }, []);

  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      siteId: "",
      title: "",
      description: "",
      severity: AlertSeverity.MEDIUM,
      location: "",
    },
  });

  const handleRaiseClick = () => {
    form.reset({
      siteId: sites[0]?.id || "",
      title: "",
      description: "",
      severity: AlertSeverity.MEDIUM,
      location: "",
    });
    setIsFormOpen(true);
  };

  const handleAcknowledge = async (alert: any) => {
    try {
      await acknowledgeAlert(alert.id);
      toast.success("Alert acknowledged successfully");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to acknowledge alert.",
      );
    }
  };

  const handleResolveClick = (alert: any) => {
    setSelectedAlert(alert);
    setResolutionNotes("");
    setIsResolveOpen(true);
  };

  const handleResolveSubmit = async () => {
    if (!selectedAlert || !user) return;
    setIsSubmitting(true);
    try {
      await resolveAlert(selectedAlert.id, {
        resolvedById: user.id,
        notes: resolutionNotes || "Resolved via Safety operations dashboard.",
      });
      toast.success("Incident alert resolved successfully");
      setIsResolveOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to resolve alert.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (alert: any) => {
    setSelectedAlert(alert);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAlert) return;
    setIsSubmitting(true);
    try {
      await deleteAlert(selectedAlert.id);
      toast.success("Safety alert deleted successfully");
      setIsDeleteOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to delete alert.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: AlertFormValues) => {
    setIsSubmitting(true);
    try {
      await createAlert(values);
      toast.success("Safety alert raised successfully");
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to raise safety alert.",
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
          title="Safety Alerts"
          subtitle="Monitor and coordinate active safety alerts across all shafts"
          actions={
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRaiseClick}
              id="create-alert-btn"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Raise Alert
            </Button>
          }
        />

        <Tabs
          value={severity || "all"}
          onValueChange={(val) =>
            setSeverity(
              val === "all" ? undefined : (val.toUpperCase() as AlertSeverity),
            )
          }
          className="w-full"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap bg-muted/20 p-1 rounded-lg">
            <TabsList className="bg-background border border-border">
              <TabsTrigger value="all" className="text-xs">
                All Severities
              </TabsTrigger>
              <TabsTrigger value="critical" className="text-xs text-red-500">
                Critical
              </TabsTrigger>
              <TabsTrigger value="high" className="text-xs text-orange-400">
                High
              </TabsTrigger>
              <TabsTrigger value="medium" className="text-xs text-amber-400">
                Medium
              </TabsTrigger>
              <TabsTrigger value="low" className="text-xs">
                Low
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select
                value={status || "active_only"}
                onValueChange={(val) =>
                  setStatus(
                    val === "all"
                      ? undefined
                      : val === "active_only"
                        ? undefined
                        : (val as AlertStatus),
                  )
                }
              >
                <SelectTrigger className="w-[150px] bg-card text-xs h-9">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_only">Active (Open/Ack)</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.values(AlertStatus).map((statusVal) => (
                    <SelectItem key={statusVal} value={statusVal}>
                      {statusVal}
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
                <SelectTrigger className="w-[180px] bg-card text-xs h-9">
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

              <SearchBar
                placeholder="Search alerts…"
                value={search}
                onChange={setSearch}
                className="w-64 h-9 text-xs"
              />
            </div>
          </div>
        </Tabs>

        <DataTable
          columns={alertColumns}
          data={data}
          isLoading={isLoading}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          emptyTitle="No alerts found"
          emptyDescription="All clear — no safety alerts at this time."
          meta={{
            onAcknowledge: handleAcknowledge,
            onResolve: handleResolveClick,
            onDelete: handleDeleteClick,
          }}
        />

        {/* Raise Alert Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-1.5">
                <AlertTriangle className="w-5 h-5" />
                Raise Operational Safety Alert
              </DialogTitle>
              <DialogDescription>
                Submit a hazard or safety incident alert. All active safety
                officers will be notified.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-2"
            >
              <div className="space-y-1">
                <Label htmlFor="title">Incident Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="E.g., High methane leak warning"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Detailed Description</Label>
                <Input
                  id="description"
                  {...form.register("description")}
                  placeholder="Detail the hazard and steps taken"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="severity">Severity Level</Label>
                  <Select
                    value={form.watch("severity")}
                    onValueChange={(val) =>
                      form.setValue("severity", val! as AlertSeverity)
                    }
                  >
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AlertSeverity).map((sevVal) => (
                        <SelectItem key={sevVal} value={sevVal}>
                          {sevVal}
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

              <div className="space-y-1">
                <Label htmlFor="location">
                  Specific Location details (Optional)
                </Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  placeholder="E.g., Sector 4 North Wall Ventilation"
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
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Raising Alert..." : "Raise Alert"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Resolve Alert Dialog */}
        <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                Resolve Incident Alert
              </DialogTitle>
              <DialogDescription>
                Provide notes outlining the actions taken to mitigate this
                safety hazard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="resolutionNotes">
                  Mitigation / Resolution Notes
                </Label>
                <Input
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="E.g., Vent fans repaired, gas levels returned to normal."
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsResolveOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveSubmit}
                disabled={isSubmitting || !resolutionNotes.trim()}
              >
                {isSubmitting ? "Resolving..." : "Resolve Alert"}
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
                  {selectedAlert?.title}
                </span>
                ? This deletes the alert record completely.
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
