import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  changeCrmOpportunityStage,
  createCrmActivity,
  createCrmContact,
  createCrmOpportunity,
  createCrmOrganization,
  deleteCrmContact,
  deleteCrmOpportunity,
  deleteCrmOrganization,
  getCrmContact,
  getCrmCounters,
  getCrmOpportunity,
  getCrmOrganization,
  listCrmActivities,
  listCrmContacts,
  listCrmOpportunities,
  listCrmOrganizations,
  updateCrmContact,
  updateCrmOpportunity,
  updateCrmOrganization,
} from "@/features/crm/crm.service";
import { server } from "@/mocks/server";

const TENANT_ID = "507f191e810c19729de860ea";
const CONTACT_ID = "507f191e810c19729de860eb";
const ORG_ID = "507f191e810c19729de860ec";
const OPP_ID = "507f191e810c19729de860ed";

const contactFixture = {
  id: CONTACT_ID,
  tenantId: TENANT_ID,
  firstName: "Ana",
  lastName: "Diaz",
  email: "ana@acme.dev",
  phone: "+56 9 1111 2222",
  organizationId: ORG_ID,
  isActive: true,
};

const organizationFixture = {
  id: ORG_ID,
  tenantId: TENANT_ID,
  name: "Acme SPA",
  domain: "acme.dev",
  industry: "SaaS",
  isActive: true,
};

const opportunityFixture = {
  id: OPP_ID,
  tenantId: TENANT_ID,
  title: "Expansion deal",
  description: "Pipeline Q2",
  stage: "lead" as const,
  amount: 15000,
  currency: "USD",
  contactId: CONTACT_ID,
  organizationId: ORG_ID,
  expectedCloseDate: "2026-06-30T00:00:00.000Z",
  isActive: true,
};

describe("crm.service", () => {
  it("lists contacts with query and tenant header", async () => {
    let capturedUrl = "";

    server.use(
      http.get("*/api/v1/modules/crm/contacts", ({ request }) => {
        capturedUrl = request.url;
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: { items: [contactFixture] },
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          traceId: "trace-crm-contacts-list",
        });
      }),
    );

    const response = await listCrmContacts(TENANT_ID, {
      search: "ana",
      organizationId: ORG_ID,
    });

    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("search")).toBe("ana");
    expect(parsed.searchParams.get("organizationId")).toBe(ORG_ID);
    expect(response.data.items[0]?.id).toBe(CONTACT_ID);
  });

  it("creates contact", async () => {
    let body: Record<string, unknown> | null = null;

    server.use(
      http.post("*/api/v1/modules/crm/contacts", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            success: true,
            data: { contact: contactFixture },
            traceId: "trace-crm-contact-create",
          },
          { status: 201 },
        );
      }),
    );

    const response = await createCrmContact(TENANT_ID, {
      firstName: "Ana",
      lastName: "Diaz",
      email: "ana@acme.dev",
    });

    expect(body).toEqual({ firstName: "Ana", lastName: "Diaz", email: "ana@acme.dev" });
    expect(response.data.contact.id).toBe(CONTACT_ID);
  });

  it("gets, updates and deletes contact", async () => {
    server.use(
      http.get(`*/api/v1/modules/crm/contacts/${CONTACT_ID}`, () =>
        HttpResponse.json({ success: true, data: { contact: contactFixture }, traceId: "trace-get" }),
      ),
      http.patch(`*/api/v1/modules/crm/contacts/${CONTACT_ID}`, async ({ request }) => {
        const body = (await request.json()) as { lastName: string };
        expect(body.lastName).toBe("Diaz Updated");
        return HttpResponse.json({
          success: true,
          data: { contact: { ...contactFixture, lastName: "Diaz Updated" } },
          traceId: "trace-patch",
        });
      }),
      http.delete(`*/api/v1/modules/crm/contacts/${CONTACT_ID}`, () =>
        HttpResponse.json({ success: true, data: { contact: contactFixture }, traceId: "trace-delete" }),
      ),
    );

    const getResp = await getCrmContact(TENANT_ID, CONTACT_ID);
    const patchResp = await updateCrmContact(TENANT_ID, CONTACT_ID, { lastName: "Diaz Updated" });
    const delResp = await deleteCrmContact(TENANT_ID, CONTACT_ID);

    expect(getResp.data.contact.id).toBe(CONTACT_ID);
    expect(patchResp.data.contact.lastName).toBe("Diaz Updated");
    expect(delResp.data.contact.id).toBe(CONTACT_ID);
  });

  it("lists and creates organizations", async () => {
    server.use(
      http.get("*/api/v1/modules/crm/organizations", () =>
        HttpResponse.json({
          success: true,
          data: { items: [organizationFixture] },
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          traceId: "trace-org-list",
        }),
      ),
      http.post("*/api/v1/modules/crm/organizations", async ({ request }) => {
        const body = (await request.json()) as { name: string };
        expect(body.name).toBe("Acme SPA");
        return HttpResponse.json(
          {
            success: true,
            data: { organization: organizationFixture },
            traceId: "trace-org-create",
          },
          { status: 201 },
        );
      }),
    );

    const listResp = await listCrmOrganizations(TENANT_ID);
    const createResp = await createCrmOrganization(TENANT_ID, { name: "Acme SPA" });

    expect(listResp.data.items[0]?.id).toBe(ORG_ID);
    expect(createResp.data.organization.id).toBe(ORG_ID);
  });

  it("gets, updates and deletes organization", async () => {
    server.use(
      http.get(`*/api/v1/modules/crm/organizations/${ORG_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: { organization: organizationFixture },
          traceId: "trace-org-get",
        }),
      ),
      http.patch(`*/api/v1/modules/crm/organizations/${ORG_ID}`, async ({ request }) => {
        const body = (await request.json()) as { industry: string };
        expect(body.industry).toBe("Enterprise SaaS");
        return HttpResponse.json({
          success: true,
          data: {
            organization: {
              ...organizationFixture,
              industry: "Enterprise SaaS",
            },
          },
          traceId: "trace-org-update",
        });
      }),
      http.delete(`*/api/v1/modules/crm/organizations/${ORG_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: { organization: organizationFixture },
          traceId: "trace-org-delete",
        }),
      ),
    );

    const getResp = await getCrmOrganization(TENANT_ID, ORG_ID);
    const patchResp = await updateCrmOrganization(TENANT_ID, ORG_ID, {
      industry: "Enterprise SaaS",
    });
    const delResp = await deleteCrmOrganization(TENANT_ID, ORG_ID);

    expect(getResp.data.organization.id).toBe(ORG_ID);
    expect(patchResp.data.organization.industry).toBe("Enterprise SaaS");
    expect(delResp.data.organization.id).toBe(ORG_ID);
  });

  it("lists and creates opportunities", async () => {
    server.use(
      http.get("*/api/v1/modules/crm/opportunities", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: { items: [opportunityFixture] },
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          traceId: "trace-opp-list",
        });
      }),
      http.post("*/api/v1/modules/crm/opportunities", async ({ request }) => {
        const body = (await request.json()) as { title: string };
        expect(body.title).toBe("Expansion deal");
        return HttpResponse.json(
          {
            success: true,
            data: { opportunity: opportunityFixture },
            traceId: "trace-opp-create",
          },
          { status: 201 },
        );
      }),
    );

    const listResp = await listCrmOpportunities(TENANT_ID, { stage: "lead" });
    const createResp = await createCrmOpportunity(TENANT_ID, {
      title: "Expansion deal",
      amount: 15000,
      currency: "USD",
    });

    expect(listResp.data.items[0]?.id).toBe(OPP_ID);
    expect(createResp.data.opportunity.id).toBe(OPP_ID);
  });

  it("gets, updates and deletes opportunity", async () => {
    server.use(
      http.get(`*/api/v1/modules/crm/opportunities/${OPP_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: { opportunity: opportunityFixture },
          traceId: "trace-opp-get",
        }),
      ),
      http.patch(`*/api/v1/modules/crm/opportunities/${OPP_ID}`, async ({ request }) => {
        const body = (await request.json()) as { title: string };
        expect(body.title).toBe("Expansion deal updated");
        return HttpResponse.json({
          success: true,
          data: {
            opportunity: {
              ...opportunityFixture,
              title: "Expansion deal updated",
            },
          },
          traceId: "trace-opp-update",
        });
      }),
      http.delete(`*/api/v1/modules/crm/opportunities/${OPP_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: { opportunity: opportunityFixture },
          traceId: "trace-opp-delete",
        }),
      ),
    );

    const getResp = await getCrmOpportunity(TENANT_ID, OPP_ID);
    const patchResp = await updateCrmOpportunity(TENANT_ID, OPP_ID, {
      title: "Expansion deal updated",
    });
    const delResp = await deleteCrmOpportunity(TENANT_ID, OPP_ID);

    expect(getResp.data.opportunity.id).toBe(OPP_ID);
    expect(patchResp.data.opportunity.title).toBe("Expansion deal updated");
    expect(delResp.data.opportunity.id).toBe(OPP_ID);
  });

  it("changes opportunity stage", async () => {
    server.use(
      http.patch(`*/api/v1/modules/crm/opportunities/${OPP_ID}/stage`, async ({ request }) => {
        const body = (await request.json()) as { stage: string };
        expect(body.stage).toBe("qualified");

        return HttpResponse.json({
          success: true,
          data: {
            opportunity: {
              ...opportunityFixture,
              stage: "qualified",
            },
          },
          traceId: "trace-opp-stage",
        });
      }),
    );

    const response = await changeCrmOpportunityStage(TENANT_ID, OPP_ID, {
      stage: "qualified",
    });

    expect(response.data.opportunity.stage).toBe("qualified");
  });

  it("lists and creates activities", async () => {
    server.use(
      http.get("*/api/v1/modules/crm/activities", () =>
        HttpResponse.json({
          success: true,
          data: {
            items: [
              {
                id: "507f191e810c19729de860ef",
                tenantId: TENANT_ID,
                type: "call",
                note: "Initial discovery",
                contactId: CONTACT_ID,
                organizationId: ORG_ID,
                opportunityId: OPP_ID,
                occurredAt: "2026-03-10T12:00:00.000Z",
              },
            ],
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
          traceId: "trace-activities-list",
        }),
      ),
      http.post("*/api/v1/modules/crm/activities", async ({ request }) => {
        const body = (await request.json()) as { type: string; note: string };
        expect(body.type).toBe("call");
        expect(body.note).toBe("Initial discovery");
        return HttpResponse.json(
          {
            success: true,
            data: {
              activity: {
                id: "507f191e810c19729de860ef",
                tenantId: TENANT_ID,
                type: "call",
                note: "Initial discovery",
                contactId: CONTACT_ID,
                organizationId: ORG_ID,
                opportunityId: OPP_ID,
                occurredAt: "2026-03-10T12:00:00.000Z",
              },
            },
            traceId: "trace-activity-create",
          },
          { status: 201 },
        );
      }),
    );

    const listResp = await listCrmActivities(TENANT_ID, { search: "discovery" });
    const createResp = await createCrmActivity(TENANT_ID, {
      type: "call",
      note: "Initial discovery",
      contactId: CONTACT_ID,
    });

    expect(listResp.data.items[0]?.id).toBe("507f191e810c19729de860ef");
    expect(createResp.data.activity.id).toBe("507f191e810c19729de860ef");
  });

  it("gets CRM counters", async () => {
    server.use(
      http.get("*/api/v1/modules/crm/counters", ({ request }) => {
        expect(request.headers.get("X-Tenant-Id")).toBe(TENANT_ID);

        return HttpResponse.json({
          success: true,
          data: {
            counters: {
              tenantId: TENANT_ID,
              contactsActive: 12,
              organizationsActive: 8,
              opportunitiesOpen: 5,
              opportunitiesWon: 10,
              opportunitiesLost: 3,
            },
          },
          traceId: "trace-crm-counters",
        });
      }),
    );

    const response = await getCrmCounters(TENANT_ID);

    expect(response.data.counters.opportunitiesOpen).toBe(5);
    expect(response.traceId).toBe("trace-crm-counters");
  });
});
