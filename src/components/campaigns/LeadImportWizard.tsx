'use client';

import React, { useState, useRef, useTransition } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Table as TableIcon,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export interface LeadImportWizardProps {
  campaignId: number;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

type WizardStep = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'COMMITTING' | 'COMPLETE';

interface ColumnMappingState {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  website: string;
  industry: string;
  country: string;
}

interface PreviewData {
  headers: string[];
  suggestedMapping: Record<string, string>;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  previewRows: Array<Record<string, any>>;
  sampleErrors: Array<{ rowNumber: number; email?: string; reason: string; message: string }>;
}

interface CommitSummary {
  enrolledCount: number;
  suppressedCount: number;
  updatedCount: number;
  totalProcessed: number;
}

export function LeadImportWizard({
  campaignId,
  campaignName,
  isOpen,
  onClose,
  onImportComplete,
}: LeadImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<ColumnMappingState>({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    website: '',
    industry: '',
    country: '',
  });

  const [progress, setProgress] = useState<number>(0);
  const [commitSummary, setCommitSummary] = useState<CommitSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validExts = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum size limit of 10MB');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);

    // Read as Base64 for resilient JSON transport
    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = reader.result as string;
      const base64 = resultStr.split(',')[1] || resultStr;
      setFileBase64(base64);
      await fetchPreview(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const fetchPreview = async (base64: string, fileName: string, customMap?: ColumnMappingState) => {
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          mapping: customMap || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse file');
      }

      setPreviewData(data);
      if (!customMap) {
        setMapping({
          email: data.suggestedMapping.email || '',
          firstName: data.suggestedMapping.firstName || '',
          lastName: data.suggestedMapping.lastName || '',
          companyName: data.suggestedMapping.companyName || '',
          website: data.suggestedMapping.website || '',
          industry: data.suggestedMapping.industry || '',
          country: data.suggestedMapping.country || '',
        });
      }
      setStep('MAPPING');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing spreadsheet');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyMapping = async () => {
    if (!mapping.email) {
      setErrorMsg('Please select an Email column mapping');
      return;
    }
    // Refresh preview with chosen custom mapping
    await fetchPreview(fileBase64, selectedFile?.name || 'file', mapping);
    setStep('PREVIEW');
  };

  const handleStartCommit = async () => {
    setStep('COMMITTING');
    setProgress(10);
    setErrorMsg(null);

    let currentIndex = 0;
    let enrolledTotal = 0;
    let suppressedTotal = 0;
    let updatedTotal = 0;
    let totalProcessedSoFar = 0;

    try {
      let isDone = false;
      while (!isDone) {
        const res = await fetch(`/api/campaigns/${campaignId}/import/commit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64,
            mapping,
            startIndex: currentIndex,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Import commit failed');
        }

        enrolledTotal += data.enrolledCount || 0;
        suppressedTotal += data.suppressedCount || 0;
        updatedTotal += data.updatedCount || 0;
        totalProcessedSoFar += data.totalProcessed || 0;

        const totalExpected = data.totalValidRows || previewData?.validCount || 1;
        const currentPct = Math.min(95, Math.round((totalProcessedSoFar / totalExpected) * 100));
        setProgress(currentPct);

        if (data.isComplete || data.nextIndex >= totalExpected) {
          isDone = true;
        } else {
          currentIndex = data.nextIndex;
        }
      }

      setProgress(100);
      setCommitSummary({
        enrolledCount: enrolledTotal,
        suppressedCount: suppressedTotal,
        updatedCount: updatedTotal,
        totalProcessed: totalProcessedSoFar,
      });
      setStep('COMPLETE');
      onImportComplete?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error committing leads to campaign');
      setStep('PREVIEW');
    }
  };

  const handleDownloadErrorReport = () => {
    if (!previewData || !previewData.sampleErrors || previewData.sampleErrors.length === 0) return;

    const headers = ['Row Number', 'Email', 'Reason', 'Details'];
    const rows = previewData.sampleErrors.map((err) => [
      err.rowNumber,
      `"${(err.email || '').replace(/"/g, '""')}"`,
      `"${err.reason}"`,
      `"${(err.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import_errors_${campaignName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setStep('UPLOAD');
    setSelectedFile(null);
    setFileBase64('');
    setPreviewData(null);
    setErrorMsg(null);
    setProgress(0);
    setCommitSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl bg-surface-100 border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-surface-200/40 shrink-0">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-text-main flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Import Leads into {campaignName}</span>
            </CardTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Upload CSV or Excel spreadsheets to enroll leads directly.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="p-1.5 h-8 w-8 rounded-lg hover:bg-surface-200 text-text-muted hover:text-text-main"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Content Body */}
        <CardContent className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 bg-surface-200/30 hover:bg-surface-200/60 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {isParsing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    {isParsing ? 'Analyzing spreadsheet...' : 'Click to select or drag and drop spreadsheet'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Supports .csv, .xlsx, .xls up to 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div className="p-3 rounded-lg bg-surface-200/50 border border-border/40 text-[11px] text-text-muted space-y-1">
                <p className="font-medium text-text-secondary">Expected Leadminer Columns:</p>
                <p>Email (required), First Name, Last Name, Company Name, Website, Industry, Country.</p>
                <p>Any additional unmapped columns are automatically saved into custom variables for templates.</p>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'MAPPING' && previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
                <span className="font-semibold text-text-main">Map Spreadsheet Columns</span>
                <span className="text-text-muted">
                  Detected {previewData.headers.length} headers in {selectedFile?.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Required: Email */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main flex items-center gap-1.5">
                    <span>Email Address</span>
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select Column --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Name */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main">Company Name</label>
                  <select
                    value={mapping.companyName}
                    onChange={(e) => setMapping({ ...mapping, companyName: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Optional / None --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* First Name */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main">First Name</label>
                  <select
                    value={mapping.firstName}
                    onChange={(e) => setMapping({ ...mapping, firstName: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Optional / None --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Last Name */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main">Last Name</label>
                  <select
                    value={mapping.lastName}
                    onChange={(e) => setMapping({ ...mapping, lastName: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Optional / None --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Website */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main">Website / Domain</label>
                  <select
                    value={mapping.website}
                    onChange={(e) => setMapping({ ...mapping, website: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Optional / None --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div className="space-y-1 p-2.5 rounded-lg bg-surface-200/60 border border-border">
                  <label className="font-medium text-text-main">Industry / Category</label>
                  <select
                    value={mapping.industry}
                    onChange={(e) => setMapping({ ...mapping, industry: e.target.value })}
                    className="w-full bg-surface-100 border border-border rounded-md px-2.5 py-1.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Optional / None --</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 'PREVIEW' && previewData && (
            <div className="space-y-4">
              {/* Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-text-muted block">Total In Sheet</span>
                  <span className="text-sm font-bold font-mono text-text-main tabular-nums">
                    {previewData.totalRows.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-success block">Valid Leads</span>
                  <span className="text-sm font-bold font-mono text-success tabular-nums">
                    {previewData.validCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-warning block">Duplicates</span>
                  <span className="text-sm font-bold font-mono text-warning tabular-nums">
                    {previewData.duplicateCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-danger block">Invalid Format</span>
                  <span className="text-sm font-bold font-mono text-danger tabular-nums">
                    {previewData.invalidCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Sample Table */}
              <div className="border border-border rounded-lg overflow-hidden bg-surface-200/30">
                <div className="p-2 border-b border-border bg-surface-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-main">Sample Preview (First 5 Rows)</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Ready to Enroll
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="py-2 text-text-muted">Email</TableHead>
                        <TableHead className="py-2 text-text-muted">Name</TableHead>
                        <TableHead className="py-2 text-text-muted">Company</TableHead>
                        <TableHead className="py-2 text-text-muted">Website</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.previewRows.map((r, i) => (
                        <TableRow key={i} className="border-border/60">
                          <TableCell className="py-2 font-mono text-primary truncate max-w-[180px]">
                            {r.email}
                          </TableCell>
                          <TableCell className="py-2 text-text-main truncate max-w-[120px]">
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                          </TableCell>
                          <TableCell className="py-2 text-text-secondary truncate max-w-[120px]">
                            {r.companyName || '—'}
                          </TableCell>
                          <TableCell className="py-2 text-text-muted font-mono truncate max-w-[120px]">
                            {r.website || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Errors callout & Download link if invalid rows exist */}
              {previewData.invalidCount > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {previewData.invalidCount} invalid or duplicate rows will be skipped during import.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrorReport}
                    className="h-7 text-[11px] gap-1 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Report</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: COMMITTING */}
          {step === 'COMMITTING' && (
            <div className="py-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-main">
                  Enrolling Leads into {campaignName}...
                </h3>
                <p className="text-xs text-text-muted">
                  Processing in bounded batches with deduplication and suppression filtering.
                </p>
              </div>
              <div className="max-w-md mx-auto pt-2 space-y-2">
                <Progress value={progress} />
                <span className="text-[11px] font-mono text-text-muted">{progress}% Completed</span>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETE */}
          {step === 'COMPLETE' && commitSummary && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text-main">
                  Import Successfully Completed!
                </h3>
                <p className="text-xs text-text-muted">
                  Leads are now enrolled in {campaignName} and ready for sequence scheduling.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs pt-2">
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-success block">Newly Enrolled</span>
                  <span className="text-base font-bold font-mono text-success tabular-nums">
                    {commitSummary.enrolledCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-text-muted block">Existing Updated</span>
                  <span className="text-base font-bold font-mono text-text-main tabular-nums">
                    {commitSummary.updatedCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-200 border border-border">
                  <span className="text-[10px] text-warning block">Suppressed Blocked</span>
                  <span className="text-base font-bold font-mono text-warning tabular-nums">
                    {commitSummary.suppressedCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Navigation */}
        <CardFooter className="p-4 border-t border-border bg-surface-200/40 flex items-center justify-between shrink-0">
          {step === 'UPLOAD' && (
            <div className="w-full flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
            </div>
          )}

          {step === 'MAPPING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('UPLOAD')}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>
              <Button
                size="sm"
                onClick={handleApplyMapping}
                className="text-xs gap-1.5"
                disabled={isParsing}
              >
                <span>Preview Validation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          {step === 'PREVIEW' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('MAPPING')}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Mapping</span>
              </Button>
              <Button
                size="sm"
                onClick={handleStartCommit}
                className="text-xs gap-1.5"
                disabled={!previewData || previewData.validCount === 0}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enroll {previewData?.validCount.toLocaleString()} Leads</span>
              </Button>
            </>
          )}

          {step === 'COMMITTING' && (
            <div className="w-full text-center text-xs text-text-muted">
              Please keep this window open while processing...
            </div>
          )}

          {step === 'COMPLETE' && (
            <div className="w-full flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  resetAll();
                  onClose();
                }}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
