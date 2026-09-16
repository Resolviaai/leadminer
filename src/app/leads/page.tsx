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
          country: leads.country,
          discoveredAt: leads.discoveredAt,
          sourceKeyword: keywords.keyword,
          category: keywords.category,
        })
        .from(leads)
        .leftJoin(keywords, eq(leads.sourceKeywordId, keywords.id))
        .orderBy(desc(leads.id))
        .limit(50),
      db.select({ total: sql<number>`count(*)::int` }).from(leads),
    ]);

    const total = countResult?.[0]?.total ?? 0;

    if (leadRows.length === 0) {
      return { list: [], total };
    }

    const leadIds = leadRows.map((l) => l.id);
    const allContacts = await db
      .select({
        id: contacts.id,
        leadId: contacts.leadId,
        contactType: contacts.contactType,
        value: contacts.value,
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
      const allEmailContacts = leadContacts.filter((c) => c.email);
      const primaryEmailContact =
        allEmailContacts.find((c) => c.contactType === "EMAIL") || allEmailContacts[0];
      const additionalEmails = allEmailContacts
        .filter((c) => c.email !== primaryEmailContact?.email)
        .map((c) => c.email as string);

      const socialLinks = leadContacts
        .filter((c) => c.contactType !== "EMAIL" || !c.email)
        .map((c) => ({
          type: c.contactType,
          value: c.value || c.instagram || c.twitter || c.tiktok || c.discord || c.linkedin || "",
        }))
        .filter((s) => Boolean(s.value));

      return {
        ...l,
        email: primaryEmailContact?.email || null,
        emailStatus: primaryEmailContact?.emailStatus || null,
        additionalEmails,
        socialLinks,
      };
    });

    return { list, total };
  } catch (err) {
    console.error("[LeadsPage Error]", err);
    return { list: [], total: 0 };
  }
}

export default async function LeadsPage() {
  const { list, total } = await getData();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
              Discovered Creators
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            {total.toLocaleString()} YouTube creators found with their channel info and verified email status.
          </p>
        </div>

        <form action="/api/workers/verification" method="POST">
          <Button size="sm" variant="default" className="gap-1.5 w-full sm:w-auto">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Verify Emails Now</span>
          </Button>
        </form>
      </Card>

      <LeadsInfiniteList initialData={list} total={total} />
    </div>
  );
}