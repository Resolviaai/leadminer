import React from 'react';
import { db } from '../../db/client';
import { templates } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { FileText, Code2 } from 'lucide-react';
import { templateEngine } from '../../services/outreach/template.engine';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

async function getTemplates() {
  try {
    return await db.select().from(templates).orderBy(desc(templates.id));
  } catch (e) {
    return [];
  }
}

export default async function TemplatesPage() {
  const list = await getTemplates();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            Outreach Email Templates
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Templates support dynamic variable substitution and optional Gemini AI personalized opening hooks.
        </p>
      </Card>

      <div className="space-y-4">
        {list.length === 0 ? (
          <Card className="p-8 text-center text-xs text-text-muted">
            No templates configured. Run database seed to install default template.
          </Card>
        ) : (
          list.map((tmpl) => {
            const previewSubject = templateEngine.render(tmpl.subject, {
              first_name: 'Joe',
              channel_name: 'The Rogan Clips',
              subscriber_count: 850000,
            });

            const previewBody = templateEngine.render(tmpl.body, {
              first_name: 'Joe',
              channel_name: 'The Rogan Clips',
              channel_url: 'https://youtube.com/channel/UC123',
              subscriber_count: 850000,
              custom_line: 'Loved your recent debate breakdown—the pacing was spot-on.',
            });

            return (
              <Card key={tmpl.id} className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-main">{tmpl.name}</h2>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Template ID: {tmpl.id}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  {/* Raw Template Definition */}
                  <div className="space-y-2.5 p-3.5 rounded-lg bg-surface-200 border border-border">
                    <div className="flex items-center space-x-1.5 text-text-secondary font-semibold text-[11px]">
                      <Code2 className="w-3.5 h-3.5 text-primary" />
                      <span>Template Definition</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Subject:</span>
                      <p className="font-mono text-text-main mt-0.5">{tmpl.subject}</p>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-text-muted block text-[10px] uppercase">Body:</span>
                      <pre className="font-mono text-text-secondary whitespace-pre-wrap leading-relaxed text-[11px] mt-0.5">
                        {tmpl.body}
                      </pre>
                    </div>
                  </div>

                  {/* Rendered Preview */}
                  <div className="space-y-2.5 p-3.5 rounded-lg bg-surface-200 border border-border">
                    <span className="text-primary font-semibold text-[11px] block">
                      Render Preview (Sample)
                    </span>
                    <div className="border-b border-border/50 pb-2">
                      <span className="text-text-muted block text-[10px] uppercase">Subject:</span>
                      <p className="font-medium text-text-main mt-0.5">{previewSubject}</p>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Body:</span>
                      <div className="text-text-secondary whitespace-pre-wrap leading-relaxed text-[11px] pt-1">
                        {previewBody}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
