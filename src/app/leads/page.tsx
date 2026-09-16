import React from "react";
import { db } from "../../db/client";
import { leads, contacts, keywords } from "../../db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { Users, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadsInfiniteList } from "@/components/leads/LeadsInfiniteList";

export const revalidate = 5;

async function getData() {
  try {
    const [leadRows, countResult] = await Promise.all([
      db
        .select({
          id: leads.id,
          channelId: leads.channelId,
          channelTitle: leads.channelTitle,
          channelUrl: leads.channelUrl,
          subscriberCount: leads.subscriberCount,
          qualificationStatus: leads.qualificationStatus,
          outreachStatus: leads.outreachStatus,
          suppressionStatus: leads.suppressionStatus,
          website: leads.website,
          phone: leads.phone,
          contactPageUrl: leads.contactPageUrl,
          country: leads.country,
          discoveredAt: leads.discoveredAt,
          sourceKeyword: keywords.keyword,
          category: keywords.category,
        })
        .from(leads)
        .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
        .orderBy(desc(leads.id))
        .limit(50),
      db
        .select({
          total: sql<number>`count(*)::int`,
          qualified: sql<number>`count(*) filter (where qualification_status = 'QUALIFIED')::int`,
          contacted: sql<number>`count(*) filter (where outreach_status = 'CONTACTED')::int`,
        })
        .from(leads),
    ]);

    const counts = countResult?.[0] || { total: 0, qualified: 0, contacted: 0 };
    const total = counts.total;

    if (leadRows.length === 0) {
      return { list: [], total, counts };
    }

    const leadIds = leadRows.map((l) => l.id);
    const allContacts = await db
      .select({
        id: contacts.id,
        leadId: contacts.leadId,
        contactType: contacts.contactType,
        value: contacts.value,
        normalizedValue: contacts.normalizedValue,
        email: contacts.email,
        emailStatus: contacts.emailStatus,
        instagram: contacts.instagram,
        twitter: contacts.twitter,
        tiktok: contacts.tiktok,
        discord: contacts.discord,
        linkedin: contacts.linkedin,
      })
      .from(contacts)
      .where(inArray(contacts.leadId, leadIds));

    const contactsByLead = new Map<number, typeof allContacts>();
    for (const c of allContacts) {
      const list = contactsByLead.get(c.leadId) || [];
      list.push(c);
      contactsByLead.set(c.leadId, list);
    }

    const list = leadRows.map((l) => {
      const leadContacts = contactsByLead.get(l.id) || [];
      const allEmailContacts = leadContacts.filter((c) => c.email || c.contactType === "EMAIL");
      const primaryEmailContact =
        allEmailContacts.find((c) => c.contactType === "EMAIL" && c.email) || allEmailContacts[0];
      const additionalEmails = allEmailContacts
        .filter((c) => c.email && c.email !== primaryEmailContact?.email)
        .map((c) => c.email as string);

      const socialLinks = leadContacts
        .filter((c) => c.contactType !== "EMAIL" && c.contactType !== "PHONE" && c.contactType !== "WHATSAPP")
        .map((c) => ({
          type: c.contactType,
          value: c.value || c.instagram || c.twitter || c.tiktok || c.discord || c.linkedin || "",
        }))
        .filter((s) => Boolean(s.value));

      const phoneContact = leadContacts.find((c) => c.contactType === "PHONE" || c.contactType === "WHATSAPP");

      return {
        ...l,
        email: primaryEmailContact?.email || null,
        emailStatus: primaryEmailContact?.emailStatus || null,
        phone: l.phone || phoneContact?.value || null,
        additionalEmails,
        socialLinks,
      };
    });

    return { list, total, counts };
  } catch (err) {
    console.error("[LeadsPage Error]", err);
    return { list: [], total: 0, counts: { total: 0, qualified: 0, contacted: 0 } };
  }
}

export default async function LeadsPage() {
  const { list, total, counts } = await getData();

  return (
    <div className="flex flex-col md:h-full flex-1 min-h-0 space-y-2.5 max-w-7xl mx-auto w-full md:overflow-hidden">
      <Card className="p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-border shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-primary" />
            <h1 className="text-sm sm:text-base font-semibold text-text-main tracking-tight">
              Contact Discovery & Leads
            </h1>
          </div>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {total.toLocaleString()} YouTube creators tracked across multi-channel discovery pipelines
          </p>
        </div>

        <form action="/api/workers/verification" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto h-8 sm:h-8.5 text-xs">
            <Play className="w-3 h-3 fill-current" />
            <span>Verify Pending Emails</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
        <Card className="p-2 sm:px-3 sm:py-2">
          <span className="text-[10px] text-text-muted block font-medium">Total Discovered Leads</span>
          <span className="text-base font-bold text-text-main font-mono tabular-nums">{total.toLocaleString()}</span>
        </Card>
        <Card className="p-2 sm:px-3 sm:py-2">
          <span className="text-[10px] text-primary block font-medium">Qualified for Outreach</span>
          <span className="text-base font-bold text-primary font-mono tabular-nums">{counts.qualified.toLocaleString()}</span>
        </Card>
        <Card className="p-2 sm:px-3 sm:py-2 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-warning block font-medium">Already Contacted</span>
          <span className="text-base font-bold text-warning font-mono tabular-nums">{counts.contacted.toLocaleString()}</span>
        </Card>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <LeadsInfiniteList initialData={list} total={total} />
      </div>
    </div>
  );
}