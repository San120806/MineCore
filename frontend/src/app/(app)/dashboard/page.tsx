'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import {
  MapPin,
  Truck,
  Radio,
  ShieldAlert,
  Cog,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { RoleGuard } from '@/features/auth/guards/RoleGuard';
import { UserRole, AlertSeverity, AlertStatus, SensorStatus, VehicleStatus, EquipmentStatus } from '@/types/enums';
import { getDashboardData, type DashboardStats } from '@/services/dashboard.service';
import { getAlerts } from '@/services/alerts.service';
import { getVehicles } from '@/services/vehicles.service';
import { getSensors } from '@/services/sensors.service';
import { getEquipmentList } from '@/services/equipment.service';
import type { SafetyAlert } from '@/types/alert';
import { AreaChartComponent, PieChartComponent, BarChartComponent, LineChartComponent } from '@/components/charts';
import { formatRelativeTime } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<SafetyAlert[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<SafetyAlert[]>([]);
  const [vehicleTrendData, setVehicleTrendData] = useState<any[]>([]);
  const [sensorDistData, setSensorDistData] = useState<any[]>([]);
  const [alertSevData, setAlertSevData] = useState<any[]>([]);
  const [equipmentHealthData, setEquipmentHealthData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        dashboardStats,
        alertsRes,
        vehiclesRes,
        sensorsRes,
        equipmentRes,
      ] = await Promise.all([
        getDashboardData(),
        getAlerts({ limit: 50 }),
        getVehicles({ limit: 100 }),
        getSensors({ limit: 100 }),
        getEquipmentList({ limit: 100 }),
      ]);

      setStats(dashboardStats);

      // Recent & Critical Alerts
      const allAlerts = alertsRes.data || [];
      setRecentAlerts(allAlerts.slice(0, 5));
      setCriticalAlerts(
        allAlerts.filter(
          (a) =>
            (a.severity === AlertSeverity.CRITICAL || a.severity === AlertSeverity.HIGH) &&
            a.status !== AlertStatus.RESOLVED
        )
      );

      // 1. Vehicle Activity by Site (or Status count if no sites)
      const vehicles = vehiclesRes.data || [];
      const sitesMap: Record<string, { label: string; active: number; idle: number }> = {};
      
      vehicles.forEach((v) => {
        const siteName = v.site?.name || 'Unassigned';
        if (!sitesMap[siteName]) {
          sitesMap[siteName] = { label: siteName, active: 0, idle: 0 };
        }
        if (v.status === VehicleStatus.ACTIVE) {
          sitesMap[siteName].active += 1;
        } else if (v.status === VehicleStatus.IDLE) {
          sitesMap[siteName].idle += 1;
        }
      });
      
      const vehicleChartData = Object.values(sitesMap);
      setVehicleTrendData(vehicleChartData.length > 0 ? vehicleChartData : [{ label: 'No Data', active: 0, idle: 0 }]);

      // 2. Sensor Status Distribution
      const sensors = sensorsRes.data || [];
      let onlineSensors = 0;
      let degradedSensors = 0;
      let offlineSensors = 0;

      sensors.forEach((s) => {
        if (s.status === SensorStatus.ONLINE) onlineSensors++;
        else if (s.status === SensorStatus.DEGRADED) degradedSensors++;
        else if (s.status === SensorStatus.OFFLINE) offlineSensors++;
      });

      setSensorDistData([
        { name: 'Online', value: onlineSensors, fill: '#10b981' },
        { name: 'Degraded', value: degradedSensors, fill: '#f59e0b' },
        { name: 'Offline', value: offlineSensors, fill: '#ef4444' },
      ]);

      // 3. Alert Distribution by Severity (grouped by OPEN/ACKNOWLEDGED status)
      let lowSev = 0, medSev = 0, highSev = 0, critSev = 0;
      allAlerts.forEach((a) => {
        if (a.status !== AlertStatus.RESOLVED) {
          if (a.severity === AlertSeverity.LOW) lowSev++;
          else if (a.severity === AlertSeverity.MEDIUM) medSev++;
          else if (a.severity === AlertSeverity.HIGH) highSev++;
          else if (a.severity === AlertSeverity.CRITICAL) critSev++;
        }
      });

      setAlertSevData([
        { label: 'Low', count: lowSev },
        { label: 'Medium', count: medSev },
        { label: 'High', count: highSev },
        { label: 'Critical', count: critSev },
      ]);

      // 4. Equipment Health score ranges
      const equipment = equipmentRes.data || [];
      let optimal = 0; // 86-100
      let warning = 0; // 51-85
      let critical = 0; // 0-50

      equipment.forEach((e) => {
        const score = e.healthScore;
        if (score > 85) optimal++;
        else if (score > 50) warning++;
        else critical++;
      });

      setEquipmentHealthData([
        { name: 'Optimal (>85)', value: optimal, fill: '#10b981' },
        { name: 'Warning (51-85)', value: warning, fill: '#f59e0b' },
        { name: 'Critical (0-50)', value: critical, fill: '#ef4444' },
      ]);

    } catch (err: any) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message || 'Failed to retrieve active metrics from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const kpis = [
    { label: 'Mining Sites',       value: stats?.sitesCount ?? '—', icon: MapPin,      color: 'blue'    as const },
    { label: 'Active Vehicles',    value: `${stats?.activeVehiclesCount ?? '—'} / ${stats?.vehiclesCount ?? '—'}`, icon: Truck,       color: 'emerald' as const },
    { label: 'Online Sensors',     value: `${stats?.onlineSensorsCount ?? '—'} / ${stats?.sensorsCount ?? '—'}`, icon: Radio,       color: 'purple'  as const },
    { label: 'Open Alerts',        value: stats?.openAlertsCount ?? '—', icon: ShieldAlert, color: 'red'     as const },
    { label: 'Equipment Health',   value: stats?.averageEquipmentHealth != null ? `${stats.averageEquipmentHealth}%` : '—', icon: Cog,         color: 'amber'   as const },
    { label: 'System Status',      value: stats && stats.openAlertsCount > 5 ? 'Warning' : stats ? 'Optimal' : '—', icon: Activity,    color: stats && stats.openAlertsCount > 5 ? ('amber' as const) : ('emerald' as const) },
  ];

  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.SAFETY_OFFICER, UserRole.MAINTENANCE_ENGINEER]}>
      <div className="space-y-6">
        <PageHeader
          title="Operations Dashboard"
          subtitle="Real-time overview of all mining operations"
        />

        {error && (
          <div className="p-4 bg-destructive/15 border border-destructive/30 rounded-lg text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartWrapper
            title="Vehicle Operations"
            subtitle="Active vs Idle vehicles by mining site"
            isLoading={isLoading}
            height={280}
          >
            <AreaChartComponent
              data={vehicleTrendData}
              dataKeys={['active', 'idle']}
              colors={['#10b981', '#6b7280']}
              showLegend
            />
          </ChartWrapper>

          <ChartWrapper
            title="Sensor Status Distribution"
            subtitle="Breakdown of sensor health across operations"
            isLoading={isLoading}
            height={280}
          >
            <PieChartComponent data={sensorDistData} showLegend />
          </ChartWrapper>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartWrapper
            title="Open Alerts by Severity"
            subtitle="Active unresolved incidents distribution"
            isLoading={isLoading}
            height={280}
          >
            <BarChartComponent
              data={alertSevData}
              dataKeys={['count']}
              colors={['#ef4444']}
            />
          </ChartWrapper>

          <ChartWrapper
            title="Equipment Health Overview"
            subtitle="Health score distribution status"
            isLoading={isLoading}
            height={280}
          >
            <PieChartComponent data={equipmentHealthData} showLegend />
          </ChartWrapper>
        </div>

        {/* Activity feed + critical alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Recent Alerts Feed</p>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="h-3.5 bg-muted/60 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted/40 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : recentAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent alerts logged.</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.site?.name || 'Unknown Site'} • {formatRelativeTime(alert.raisedAt)}
                      </p>
                    </div>
                    <StatusBadge value={alert.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Critical Alerts (Active)</p>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="h-4 bg-muted/60 rounded w-3/4 animate-pulse mb-2" />
                  <div className="h-3 bg-muted/40 rounded w-1/2 animate-pulse" />
                </div>
              ) : criticalAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <ShieldAlert className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No active critical alerts</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {criticalAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-3"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-200">{alert.title}</p>
                        <p className="text-xs text-red-300/80 truncate">{alert.description}</p>
                        <p className="text-[10px] text-red-400/60 mt-1">
                          {alert.site?.name} • {formatRelativeTime(alert.raisedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
