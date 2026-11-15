'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export interface CampaignLeadsViewProps {
  campaigns: Array<{ id: number; name: string }>;
  initialCampaignId?: number;
  onOpenImportWizard: (campaignId: number, campaignName: string) => void;
}

export function CampaignLeadsView({
  campaigns,
  initialCampaignId,
  onOpenImportWizard,
}: CampaignLeadsViewProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(
    initialCampaignId || (campaigns[0]?.id ?? 1)
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const fetchLeads = async () => {
    if (!selectedCampaignId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const url = new URL(`/api/campaigns/${selectedCampaignId}/leads`, window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (statusFilter !== 'ALL') {
        url.searchParams.set('status', statusFilter);
      }

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch campaign leads');
      }

      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedCampaignId, statusFilter, page]);

  const filteredLeads = leads.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.email?.toLowerCase().includes(q) ||
      l.companyName?.toLowerCase().includes(q) ||
      l.firstName?.toLowerCase().includes(q) ||
      l.lastName?.toLowerCase().includes(q) ||
      l.channelTitle?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'outline';
      case 'SCHEDULED':
        return 'secondary';
      case 'CONTACTED':
        return 'default';
      case 'REPLIED':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'DISQUALIFIED':
        return 'danger';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="p-3 sm:p-4 bg-surface-100 border-border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campaign Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted shrink-0">Campaign:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(Number(e.target.value));
                setPage(1);
              }}
              className="bg-surface-200 border border-border text-xs text-text-main rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-200 border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs text-text-secondary hover:text-text-main shrink-0"
              title="Refresh leads"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              onClick={() => onOpenImportWizard(activeCampaign?.id, activeCampaign?.name)}
              className="h-8 text-xs gap-1.5 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Leads</span>
            </Button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 overflow-x-auto text-xs">
          <span className="text-[11px] text-text-muted mr-1 shrink-0">Status:</span>
          {[
            'ALL',
            'ENROLLED',
            'SCHEDULED',
            'CONTACTED',
            'REPLIED',
            'COMPLETED',
            'PAUSED',
            'DISQUALIFIED',
          ].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-primary text-black font-semibold'
                  : 'bg-surface-200 text-text-secondary hover:text-text-main hover:bg-surface-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="bg-surface-100 border-border overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-text-muted flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Loading enrolled leads...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-xs text-text-muted space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-text-muted mx-auto opacity-40" />
            <p>No leads found for this campaign with status "{statusFilter}".</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenImportWizard(activeCampaign?.id, activeCampaign?.name)}
              className="text-xs gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import Spreadsheet Leads</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-surface-200/50">
                <TableRow className="border-border">
                  <TableHead className="py-2.5 text-text-muted font-medium">Lead / Company</TableHead>
                  <TableHead className="py-2.5 text-text-muted font-medium">Email Address</TableHead>
                  <TableHead className="py-2.5 text-text-muted font-medium">Status</TableHead>
                  <TableHead className="py-2.5 text-text-muted font-medium">Step</TableHead>
                  <TableHead className="py-2.5 text-text-muted font-medium">Source</TableHead>
                  <TableHead className="py-2.5 text-text-muted font-medium">Enrolled At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((item) => (
                  <TableRow key={item.id} className="border-border/60 hover:bg-surface-200/30">
                    <TableCell className="py-2.5 font-medium text-text-main">
                      <div className="flex flex-col">
                        <span>
                          {item.companyName ||
                            item.channelTitle ||
                            [item.firstName, item.lastName].filter(Boolean).join(' ') ||
                            'Lead #' + item.leadId}
                        </span>
                        {item.website && (
                          <a
                            href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-text-muted hover:text-primary font-mono inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>{item.website}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-primary truncate max-w-[200px]">
                      {item.email || '—'}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <Badge variant={getStatusBadgeVariant(item.status) as any} className="text-[10px] px-1.5 py-0">
                        {item.status}
                      </Badge>
                      {item.disqualifiedReason && (
                        <span className="block text-[9px] text-danger mt-0.5 font-mono">
                          {item.disqualifiedReason}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-text-secondary">
                      Step {item.currentStepNumber}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.sourceProvider || 'CSV'}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2.5 text-text-muted text-[11px] whitespace-nowrap">
                      {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > limit && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span className="tabular-nums">
              Showing {(page - 1) * limit + 1}–{Math.min(total, page * limit)} of {total.toLocaleString()} leads
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-mono tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
