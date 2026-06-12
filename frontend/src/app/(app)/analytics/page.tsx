'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Analytics Dashboard
// Multi-tab interactive reporting with loading, error, and empty states.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import {
  AreaChartComponent,
  PieChartComponent,
  BarChartComponent,
  LineChartComponent,
} from '@/components/charts';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole } from '@/types/enums';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsData, type AnalyticsData } from '@/services/analytics.service';

import {
  Truck,
  Cog,
  Radio,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  FileText,
  DollarSign,
  Heart,
  Activity,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const reportData = await getAnalyticsData();
      setData(reportData);
    } catch (err: any) {
      console.error('Failed to compile analytics statistics:', err);
      setIsError(true);
      setErrorMessage(err.message || 'Could not fetch operational datasets from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Summary Metrics Helper
  const getSummaryMetrics = () => {
    if (!data) return null;

    // Fleet Stats
    const totalVehicles = data.vehicleStatus.reduce((sum, item) => sum + item.value, 0);
    const activeVehicles = data.vehicleStatus.find((v) => v.name === 'Active')?.value ?? 0;
    const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    // Equipment Stats
    const totalEquipment = data.equipmentStatus.reduce((sum, item) => sum + item.value, 0);
    const optimalEquip = data.equipmentHealthDist.find((e) => e.name.startsWith('Optimal'))?.value ?? 0;
    const averageHealth = data.equipmentTypeAvgHealth.length > 0 
      ? Math.round(data.equipmentTypeAvgHealth.reduce((sum, item) => sum + Number(item.health), 0) / data.equipmentTypeAvgHealth.length) 
      : 0;

    // Sensor Stats
    const totalSensors = data.sensorTypeDist.reduce((sum, item) => sum + item.value, 0);
    const onlineSensors = data.sensorStatus.find((s) => s.label === 'Online')?.count as number ?? 0;

    // Safety Stats
    const totalAlerts = data.alertSeverity.reduce((sum, item) => sum + item.value, 0);
    const criticalAlerts = data.alertSeverity.find((a) => a.name === 'Critical')?.value ?? 0;

    // Maintenance Stats
    const totalMaintenance = data.maintenanceStatus.reduce((sum, item) => sum + item.value, 0);
    const totalCost = data.maintenanceCostBySite.reduce((sum, item) => sum + Number(item.cost), 0);

    return {
      totalVehicles,
      activeVehicles,
      utilizationRate,
      totalEquipment,
      optimalEquip,
      averageHealth,
      totalSensors,
      onlineSensors,
      totalAlerts,
      criticalAlerts,
      totalMaintenance,
      totalCost,
    };
  };

  const metrics = getSummaryMetrics();

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.SAFETY_OFFICER, UserRole.MAINTENANCE_ENGINEER]}>
      <div className="space-y-6">
        <PageHeader
          title="Operational Analytics"
          subtitle="Real-time analytics and charts driven directly by backend datasets"
        />

        {isError && (
          <div className="p-4 bg-destructive/15 border border-destructive/30 rounded-lg text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Error compiling reports: {errorMessage}</span>
          </div>
        )}

        <Tabs defaultValue="fleet" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-4xl bg-muted/60 p-1 rounded-lg">
            <TabsTrigger value="fleet" className="flex items-center gap-2 py-2">
              <Truck className="w-4 h-4" />
              <span className="hidden md:inline">Fleet & Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2 py-2">
              <Cog className="w-4 h-4" />
              <span className="hidden md:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="sensors" className="flex items-center gap-2 py-2">
              <Radio className="w-4 h-4" />
              <span className="hidden md:inline">IoT Sensors</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2 py-2">
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden md:inline">Safety & Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2 py-2">
              <Wrench className="w-4 h-4" />
              <span className="hidden md:inline">Maintenance</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── FLEET & VEHICLES TAB ───────────────────────────────────────── */}
          <TabsContent value="fleet" className="mt-6 space-y-6">
            {/* Fleet Summary Mini Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Fleet Size</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.totalVehicles}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Active Vehicles</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">
                    {isLoading ? '—' : `${metrics?.activeVehicles} / ${metrics?.totalVehicles}`}
                  </p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Badge className="bg-purple-500/20 text-purple-300 border-none shrink-0 text-[10px]">%</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Active Utilization</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : `${metrics?.utilizationRate}%`}</p>
                </div>
              </Card>
            </div>

            {/* Fleet Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <ChartWrapper
                  title="Vehicle Status Distribution"
                  subtitle="Breakdown of fleet by status"
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={!isLoading && metrics?.totalVehicles === 0}
                  emptyText="No vehicles found in the fleet database."
                >
                  <PieChartComponent data={data?.vehicleStatus || []} showLegend />
                </ChartWrapper>
              </div>
              <div className="lg:col-span-2">
                <ChartWrapper
                  title="Fleet Utilization by Site"
                  subtitle="Active vs Idle vehicles per mining site location"
                  isLoading={isLoading}
                  isError={isError}
                  isEmpty={!isLoading && data?.vehicleSiteUtilization.length === 0}
                  emptyText="No location-assigned vehicles to show."
                >
                  <AreaChartComponent
                    data={data?.vehicleSiteUtilization || []}
                    dataKeys={['active', 'idle']}
                    colors={['#10b981', '#6b7280']}
                    showLegend
                  />
                </ChartWrapper>
              </div>
            </div>

            <ChartWrapper
              title="Average Fuel / Power Levels"
              subtitle="Average remaining fuel or battery level by vehicle class type (%)"
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && data?.vehicleTypeAvgFuel.length === 0}
            >
              <BarChartComponent
                data={data?.vehicleTypeAvgFuel || []}
                dataKeys={['fuel']}
                colors={['#3b82f6']}
              />
            </ChartWrapper>
          </TabsContent>

          {/* ─── EQUIPMENT TAB ────────────────────────────────────────────── */}
          <TabsContent value="equipment" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Cog className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Registered Assets</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.totalEquipment}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Optimal Condition Assets</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">
                    {isLoading ? '—' : `${metrics?.optimalEquip} / ${metrics?.totalEquipment}`}
                  </p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Badge className="bg-amber-500/20 text-amber-300 border-none shrink-0 text-[10px]">%</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Average Fleet Health</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : `${metrics?.averageHealth}%`}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartWrapper
                title="Equipment Status Breakdown"
                subtitle="Operational vs under-maintenance vs failed equipment counts"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalEquipment === 0}
                emptyText="No heavy equipment registered."
              >
                <PieChartComponent data={data?.equipmentStatus || []} showLegend />
              </ChartWrapper>

              <ChartWrapper
                title="Health Score Distribution"
                subtitle="Asset classification counts by structural health score"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalEquipment === 0}
              >
                <PieChartComponent data={data?.equipmentHealthDist || []} showLegend />
              </ChartWrapper>
            </div>

            <ChartWrapper
              title="Average Condition Score by Machine Type"
              subtitle="Averaged structural integrity percentage index (0-100%)"
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && data?.equipmentTypeAvgHealth.length === 0}
            >
              <BarChartComponent
                data={data?.equipmentTypeAvgHealth || []}
                dataKeys={['health']}
                colors={['#10b981']}
              />
            </ChartWrapper>
          </TabsContent>

          {/* ─── SENSORS TAB ──────────────────────────────────────────────── */}
          <TabsContent value="sensors" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Active Sensors</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.totalSensors}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Online Status Rate</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">
                    {isLoading ? '—' : `${metrics?.onlineSensors} / ${metrics?.totalSensors}`}
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartWrapper
                title="Sensor Class Type Distribution"
                subtitle="Concentration of environmental and mechanical telemetry devices"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalSensors === 0}
                emptyText="No active sensors registered."
              >
                <PieChartComponent data={data?.sensorTypeDist || []} showLegend />
              </ChartWrapper>

              <ChartWrapper
                title="Sensor Connection Breakdown"
                subtitle="Online vs degraded vs offline telemetry nodes"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalSensors === 0}
              >
                <BarChartComponent
                  data={data?.sensorStatus || []}
                  dataKeys={['count']}
                  colors={['#8b5cf6']}
                />
              </ChartWrapper>
            </div>

            <ChartWrapper
              title="Average Reading Level by Sensor Class"
              subtitle="Telemetry averages grouped by sensor parameter types"
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && data?.sensorTypeAvgValue.length === 0}
            >
              <LineChartComponent
                data={data?.sensorTypeAvgValue || []}
                dataKeys={['value']}
                colors={['#ec4899']}
              />
            </ChartWrapper>
          </TabsContent>

          {/* ─── SAFETY & ALERTS TAB ────────────────────────────────────────── */}
          <TabsContent value="safety" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Safety Incidents Logged</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.totalAlerts}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Active Critical Incidents</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.criticalAlerts}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartWrapper
                title="Alert Severity Ratios"
                subtitle="Distribution of incident logs by threat level"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalAlerts === 0}
                emptyText="No incidents or safety alerts on record."
              >
                <PieChartComponent data={data?.alertSeverity || []} showLegend />
              </ChartWrapper>

              <ChartWrapper
                title="Alert Frequency by Mining Site"
                subtitle="Accumulated raised alert records grouped by location"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && data?.alertFrequencyBySite.length === 0}
                emptyText="No alerts recorded across sites."
              >
                <BarChartComponent
                  data={data?.alertFrequencyBySite || []}
                  dataKeys={['count']}
                  colors={['#f59e0b']}
                />
              </ChartWrapper>
            </div>

            <ChartWrapper
              title="Open vs Resolved Ratio per Mining Site"
              subtitle="Comparison of active cases versus resolved conditions by location"
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && data?.alertStatusRatio.length === 0}
            >
              <AreaChartComponent
                data={data?.alertStatusRatio || []}
                dataKeys={['open', 'resolved']}
                colors={['#ef4444', '#10b981']}
                showLegend
              />
            </ChartWrapper>
          </TabsContent>

          {/* ─── MAINTENANCE TAB ────────────────────────────────────────────── */}
          <TabsContent value="maintenance" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Maintenance Orders</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">{isLoading ? '—' : metrics?.totalMaintenance}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Completed Repairs</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">
                    {isLoading ? '—' : `${data?.maintenanceStatus.find((m) => m.name === 'Completed')?.value ?? 0} / ${metrics?.totalMaintenance}`}
                  </p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4 border-border bg-card">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Total Repairs Cost</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5 tabular-nums">
                    {isLoading ? '—' : `$${metrics?.totalCost.toLocaleString()}`}
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartWrapper
                title="Job Request Statuses"
                subtitle="Scheduled vs active vs completed logs"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalMaintenance === 0}
                emptyText="No maintenance orders found."
              >
                <PieChartComponent data={data?.maintenanceStatus || []} showLegend />
              </ChartWrapper>

              <ChartWrapper
                title="Maintenance Type Counts"
                subtitle="Preventive vs corrective vs emergency logs"
                isLoading={isLoading}
                isError={isError}
                isEmpty={!isLoading && metrics?.totalMaintenance === 0}
              >
                <BarChartComponent
                  data={data?.maintenanceTypeDist || []}
                  dataKeys={['count']}
                  colors={['#14b8a6']}
                />
              </ChartWrapper>
            </div>

            <ChartWrapper
              title="Cumulative Maintenance Cost by Site"
              subtitle="Operational maintenance expenditures aggregated per site location ($)"
              isLoading={isLoading}
              isError={isError}
              isEmpty={!isLoading && data?.maintenanceCostBySite.length === 0}
            >
              <AreaChartComponent
                data={data?.maintenanceCostBySite || []}
                dataKeys={['cost']}
                colors={['#f43f5e']}
              />
            </ChartWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
