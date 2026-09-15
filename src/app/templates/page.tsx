import React from 'react';
import { db } from '../../db/client';
import { templates } from '../../db/schema';
import { desc } from 'drizzle-orm';
import { FileText, Code2 } from 'lucide-react';
import { templateEngine } from '../../services/outreach/template.engine';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold text-white tracking-tight">Outreach Email Templates</h1>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Templates support dynamic variable substitution and optional Gemini AI personalized opening hooks.
        </p>
      </div>

      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="p-8 rounded-lg bg-white/[0.02] border border-white/10 text-center text-slate-500 text-xs">
            No templates configured. Run <code className="text-indigo-400">npm run db:seed</code> to install the default template.
          </div>
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
              <div key={tmpl.id} className="p-5 rounded-lg bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">{tmpl.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400">
                    Template ID: {tmpl.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                  {/* Raw Template Definition */}
                  <div className="space-y-2 p-3 rounded bg-black/40 border border-white/5">
                    <div className="flex items-center space-x-1.5 text-slate-400 font-semibold text-[11px]">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Template Variables & Content</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Subject:</span>
                      <p className="font-mono text-slate-300">{tmpl.subject}</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 block text-[10px] uppercase">Body:</span>
                      <pre className="font-mono text-slate-400 whitespace-pre-wrap leading-relaxed text-[11px]">
                        {tmpl.body}
                      </pre>
                    </div>
                  </div>

                  {/* Rendered Preview */}
                  <div className="space-y-2 p-3 rounded bg-white/[0.02] border border-white/10">
                    <span className="text-emerald-400 font-semibold text-[11px] block">Live Render Preview (Sample)</span>
                    <div className="border-b border-white/10 pb-2">
                      <span className="text-slate-500 block text-[10px] uppercase">Subject:</span>
                      <p className="font-medium text-white">{previewSubject}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Body:</span>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] pt-1">
                        {previewBody}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
