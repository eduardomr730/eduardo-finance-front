import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      create: createMock,
    },
  },
}));

vi.mock("@/server/finance-service", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "user_123",
    settings: {
      freelancerMonthlyFee: 90,
    },
  })),
}));

describe("POST /api/invoices", () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({ id: "invoice_1", clientName: "Cliente" });
  });

  it("validates input and persists computed invoice values", async () => {
    const { POST } = await import("@/app/api/invoices/route");

    const response = await POST(
      new Request("http://localhost/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          issueDate: "2026-03-01",
          clientName: "Cliente recurrente",
          baseAmount: 1949.65,
          vatRate: 0.21,
          withholdingRate: 0.15,
          effectiveIrpfRate: 0.24,
          status: "PAID",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock.mock.calls[0][0].data.clientName).toBe("Cliente recurrente");
    expect(Number(createMock.mock.calls[0][0].data.expectedBankAmount)).toBe(2066.63);
    expect(Number(createMock.mock.calls[0][0].data.pendingIrpfProvision)).toBe(175.47);
  });
});
