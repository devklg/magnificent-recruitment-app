import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Filter,
  MoreVertical,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'new' | 'contacted' | 'interested' | 'enrolled' | 'inactive';
  source: 'manual' | 'import' | 'referral' | 'website';
  addedDate: string;
  lastContact: string;
  notes: string;
  commissionPotential: number;
}

interface CRMStats {
  totalProspects: number;
  newThisWeek: number;
  contacted: number;
  enrolled: number;
  totalCommissions: number;
  thisMonthCommissions: number;
}

export const PromoterSidebar: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [crmStats, setCrmStats] = useState<CRMStats | null>(null);
  const [isAddingProspect, setIsAddingProspect] = useState(false);

  // Mock data - connect to backend API
  useEffect(() => {
    // TODO: Replace with actual API calls
    setProspects([
      {
        id: 'P001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '+1 (555) 123-4567',
        city: 'Austin',
        state: 'TX',
        status: 'interested',
        source: 'referral',
        addedDate: '2025-07-18',
        lastContact: '2025-07-19',
        notes: 'Very interested in PowerLine opportunity. Follow up tomorrow.',
        commissionPotential: 2500
      },
      {
        id: 'P002',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 234-5678',
        city: 'Seattle',
        state: 'WA',
        status: 'new',
        source: 'website',
        addedDate: '2025-07-19',
        lastContact: '',
        notes: 'Just signed up through website. Need initial contact.',
        commissionPotential: 1800
      },
      {
        id: 'P003',
        firstName: 'Jessica',
        lastName: 'Martinez',
        email: 'j.martinez@email.com',
        phone: '+1 (555) 345-6789',
        city: 'Miami',
        state: 'FL',
        status: 'enrolled',
        source: 'manual',
        addedDate: '2025-07-15',
        lastContact: '2025-07-16',
        notes: 'Successfully enrolled! Great team player.',
        commissionPotential: 3200
      },
      {
        id: 'P004',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'd.wilson@email.com',
        phone: '+1 (555) 456-7890',
        city: 'Denver',
        state: 'CO',
        status: 'contacted',
        source: 'import',
        addedDate: '2025-07-17',
        lastContact: '2025-07-18',
        notes: 'Had great initial conversation. Scheduling follow-up call.',
        commissionPotential: 2100
      }
    ]);

    setCrmStats({
      totalProspects: 47,
      newThisWeek: 12,
      contacted: 28,
      enrolled: 8,
      totalCommissions: 24750,
      thisMonthCommissions: 8450
    });
  }, []);

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || prospect.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-purple-100 text-purple-800';
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return <UserPlus className="h-3 w-3" />;
      case 'import': return <Users className="h-3 w-3" />;
      case 'referral': return <MessageSquare className="h-3 w-3" />;
      case 'website': return <Target className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col">
      
      {/* CRM Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">CRM Center</h2>
          <Button 
            size="sm" 
            onClick={() => setIsAddingProspect(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Quick Stats */}
        {crmStats && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-700">{crmStats.totalProspects}</div>
              <div className="text-xs text-blue-600">Total Prospects</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-700">{crmStats.enrolled}</div>
              <div className="text-xs text-green-600">Enrolled</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search prospects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All', count: prospects.length },
            { key: 'new', label: 'New', count: prospects.filter(p => p.status === 'new').length },
            { key: 'interested', label: 'Hot', count: prospects.filter(p => p.status === 'interested').length },
            { key: 'enrolled', label: 'Won', count: prospects.filter(p => p.status === 'enrolled').length }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterStatus === filter.key 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Prospects List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredProspects.map((prospect) => (
            <Card key={prospect.id} className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
              <div className="space-y-2">
                
                {/* Prospect Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {prospect.firstName[0]}{prospect.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {prospect.firstName} {prospect.lastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {prospect.city}, {prospect.state}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Prospect
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Call
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Edit Prospect
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Remove Prospect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Source */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs px-2 py-0 ${getStatusColor(prospect.status)}`}>
                      {prospect.status.toUpperCase()}
                    </Badge>
                    <div className="flex items-center space-x-1 text-slate-400">
                      {getSourceIcon(prospect.source)}
                      <span className="text-xs">{prospect.source}</span>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ${prospect.commissionPotential.toLocaleString()}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs text-slate-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{prospect.email}</span>
                  </div>
                  {prospect.phone && (
                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                      <Phone className="h-3 w-3" />
                      <span>{prospect.phone}</span>
                    </div>
                  )}
                </div>

                {/* Last Contact */}
                {prospect.lastContact && (
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>Last contact: {new Date(prospect.lastContact).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Notes Preview */}
                {prospect.notes && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    {prospect.notes.length > 80 ? 
                      `${prospect.notes.substring(0, 80)}...` : 
                      prospect.notes
                    }
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex space-x-1 pt-1">
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* CRM Summary Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">This Month:</span>
            <span className="font-semibold text-green-600">
              ${crmStats?.thisMonthCommissions.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Total Earned:</span>
            <span className="font-semibold text-green-600">
              ${crmStats?.totalCommissions.toLocaleString()}
            </span>
          </div>
          <Separator className="my-2" />
          <Button variant="outline" size="sm" className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Full CRM
          </Button>
        </div>
      </div>

    </div>
  );
};