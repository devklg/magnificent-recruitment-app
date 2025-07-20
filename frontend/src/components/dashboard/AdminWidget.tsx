import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  UserPlus,
  Download,
  Printer,
  Shield,
  AlertCircle,
  TrendingUp,
  Database,
  Activity,
  Calendar,
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  totalCommissionsPaid: number;
  pendingApprovals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: string;
  launchCountdown: number; // days until launch
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export const AdminWidget: React.FC = () => {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  // Mock data - connect to backend API
  useEffect(() => {
    // TODO: Replace with actual API calls
    setAdminStats({
      totalUsers: 12543,
      newUsersToday: 47,
      totalCommissionsPaid: 247500,
      pendingApprovals: 8,
      systemHealth: 'excellent',
      lastBackup: '2025-07-19T06:00:00Z',
      launchCountdown: 13
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh data from API
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'add-user',
      label: 'Add User',
      icon: UserPlus,
      action: () => setShowUserForm(true)
    },
    {
      id: 'export-users',
      label: 'Export Users',
      icon: Download,
      action: () => {
        // TODO: Implement CSV export
        console.log('Exporting users...');
      }
    },
    {
      id: 'print-report',
      label: 'Print Report',
      icon: Printer,
      action: () => {
        // TODO: Implement print functionality
        window.print();
      }
    },
    {
      id: 'system-backup',
      label: 'Manual Backup',
      icon: Database,
      action: () => {
        // TODO: Implement backup
        console.log('Starting backup...');
      }
    }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-72 bg-white border border-slate-200 rounded-lg shadow-sm">
      
      {/* Admin Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Admin Control</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="p-4 space-y-4">
        
        {/* Launch Countdown */}
        <div className="text-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">
            {adminStats?.launchCountdown} Days
          </div>
          <div className="text-sm text-orange-600">Until Launch</div>
          <div className="text-xs text-orange-500 mt-1">July 30, 2025</div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">
              {adminStats?.totalUsers.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600">Total Users</div>
            <div className="text-xs text-blue-500 mt-1">
              +{adminStats?.newUsersToday} today
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(adminStats?.totalCommissionsPaid || 0)}
            </div>
            <div className="text-xs text-green-600">Commissions</div>
            <div className="text-xs text-green-500 mt-1">
              This month
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">System Health</span>
            <Badge className={`text-xs ${getHealthColor(adminStats?.systemHealth || 'good')}`}>
              <Activity className="h-3 w-3 mr-1" />
              {adminStats?.systemHealth?.toUpperCase()}
            </Badge>
          </div>
          
          {adminStats?.pendingApprovals && adminStats.pendingApprovals > 0 && (
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {adminStats.pendingApprovals} pending approvals
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="h-8 text-xs"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Controls */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Advanced</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>User Management</DropdownMenuLabel>
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Bulk Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Reports</DropdownMenuLabel>
              <DropdownMenuItem>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="h-4 w-4 mr-2" />
                Commission Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>System</DropdownMenuLabel>
              <DropdownMenuItem>
                <Database className="h-4 w-4 mr-2" />
                Database Status
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Activity className="h-4 w-4 mr-2" />
                System Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                Export All Users (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export Commissions (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export Team Structure (JSON)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Print User Directory
              </DropdownMenuItem>
              <DropdownMenuItem>
                Print Commission Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Emergency Actions */}
        <div className="pt-2 border-t border-slate-200">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <AlertCircle className="h-4 w-4 mr-2" />
                Emergency Controls
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Emergency System Controls</AlertDialogTitle>
                <AlertDialogDescription>
                  These controls should only be used in emergency situations. 
                  Please confirm you want to access emergency functions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                  Access Emergency Controls
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>

      {/* System Info Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Last backup:</span>
          <span>
            {adminStats?.lastBackup ? 
              new Date(adminStats.lastBackup).toLocaleDateString() : 
              'Never'
            }
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Version:</span>
          <span>v2.0.1</span>
        </div>
      </div>

    </div>
  );
};