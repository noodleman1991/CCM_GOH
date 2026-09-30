import { expect, it } from "vitest";
import { groupLogos } from "@/lib/logos/group-logos";

const org = (id: string) => ({ id, name: id.toUpperCase() });

it("puts funders and hosts first, once, and keeps the editor's order", () => {
  const out = groupLogos({ fundedBy: [org("wellcome")], hostedBy: [org("ccc")], partners: [org("imperial"), org("wellcome"), org("qcmhr")], others: [org("x")] });
  expect(out.leads.map((l) => [l.item.id, l.role])).toEqual([["wellcome", "fundedBy"], ["ccc", "hostedBy"]]);
  expect(out.partners.map((p) => p.id)).toEqual(["imperial", "qcmhr"]);
  expect(out.others.map((p) => p.id)).toEqual(["x"]);
});

it("an organisation both funding and hosting shows once, as the funder", () => {
  const out = groupLogos({ fundedBy: [org("a")], hostedBy: [org("a")], partners: [], others: [] });
  expect(out.leads).toEqual([{ item: org("a"), role: "fundedBy" }]);
});
