import { RegionCode } from "./region-codes";

/**
 * ISO-3166 alpha-3 → UN-M49 SDG region. Source: the UN M49 standard
 * (https://unstats.un.org/unsd/methodology/m49/). Every UN member/observer with
 * a land polygon is assigned to exactly one of the 7 SDG regions. Antarctica
 * (ATA) and uninhabited territories are intentionally omitted (→ null).
 *
 * Notes on a few M49 placements that surprise people:
 *  - Cyprus (CYP), Armenia (ARM), Azerbaijan (AZE), Georgia (GEO) → Western Asia
 *    → nawa.
 *  - Iran (IRN) → Southern Asia → csa.
 *  - Russia (RUS) → Eastern Europe → enam.
 *  - Greenland (GRL) → Northern America → enam.
 *  - Sudan (SDN) → Sub-Saharan Africa; the rest of N. Africa (DZA/EGY/LBY/MAR/TUN)
 *    → nawa.
 */
export const REGION_MEMBERSHIP: Record<string, RegionCode> = {
  // ---- Sub-Saharan Africa ----------------------------------------------------
  AGO: "ssa", BEN: "ssa", BWA: "ssa",
  BFA: "ssa", BDI: "ssa", CPV: "ssa",
  CMR: "ssa", CAF: "ssa", TCD: "ssa",
  COM: "ssa", COG: "ssa", COD: "ssa",
  CIV: "ssa", DJI: "ssa", GNQ: "ssa",
  ERI: "ssa", SWZ: "ssa", ETH: "ssa",
  GAB: "ssa", GMB: "ssa", GHA: "ssa",
  GIN: "ssa", GNB: "ssa", KEN: "ssa",
  LSO: "ssa", LBR: "ssa", MDG: "ssa",
  MWI: "ssa", MLI: "ssa", MRT: "ssa",
  MUS: "ssa", MOZ: "ssa", NAM: "ssa",
  NER: "ssa", NGA: "ssa", RWA: "ssa",
  STP: "ssa", SEN: "ssa", SYC: "ssa",
  SLE: "ssa", SOM: "ssa", ZAF: "ssa",
  SSD: "ssa", SDN: "ssa", TGO: "ssa",
  TZA: "ssa", UGA: "ssa", ZMB: "ssa",
  ZWE: "ssa",

  // ---- Northern Africa and Western Asia --------------------------------------
  DZA: "nawa", EGY: "nawa",
  LBY: "nawa", MAR: "nawa",
  TUN: "nawa", ESH: "nawa",
  ARM: "nawa", AZE: "nawa",
  BHR: "nawa", CYP: "nawa",
  GEO: "nawa", IRQ: "nawa",
  ISR: "nawa", JOR: "nawa",
  KWT: "nawa", LBN: "nawa",
  OMN: "nawa", PSE: "nawa",
  QAT: "nawa", SAU: "nawa",
  SYR: "nawa", TUR: "nawa",
  ARE: "nawa", YEM: "nawa",

  // ---- Central and Southern Asia ---------------------------------------------
  KAZ: "csa", KGZ: "csa",
  TJK: "csa", TKM: "csa",
  UZB: "csa", AFG: "csa",
  BGD: "csa", BTN: "csa",
  IND: "csa", IRN: "csa",
  MDV: "csa", NPL: "csa",
  PAK: "csa", LKA: "csa",

  // ---- Eastern and South-Eastern Asia ----------------------------------------
  CHN: "esea", PRK: "esea",
  JPN: "esea", MNG: "esea",
  KOR: "esea", TWN: "esea",
  BRN: "esea", KHM: "esea",
  IDN: "esea", LAO: "esea",
  MYS: "esea", MMR: "esea",
  PHL: "esea", SGP: "esea",
  THA: "esea", TLS: "esea",
  VNM: "esea",

  // ---- Latin America and the Caribbean ---------------------------------------
  ATG: "lac", ARG: "lac",
  BHS: "lac", BRB: "lac",
  BLZ: "lac", BOL: "lac",
  BRA: "lac", CHL: "lac",
  COL: "lac", CRI: "lac",
  CUB: "lac", DMA: "lac",
  DOM: "lac", ECU: "lac",
  SLV: "lac", GRD: "lac",
  GTM: "lac", GUY: "lac",
  HTI: "lac", HND: "lac",
  JAM: "lac", MEX: "lac",
  NIC: "lac", PAN: "lac",
  PRY: "lac", PER: "lac",
  KNA: "lac", LCA: "lac",
  VCT: "lac", SUR: "lac",
  TTO: "lac", URY: "lac",
  VEN: "lac",

  // ---- Oceania ---------------------------------------------------------------
  AUS: "oce", NZL: "oce", FJI: "oce", PNG: "oce",
  SLB: "oce", VUT: "oce", FSM: "oce", KIR: "oce",
  MHL: "oce", NRU: "oce", PLW: "oce", WSM: "oce",
  TON: "oce", TUV: "oce",

  // ---- Europe and North America ----------------------------------------------
  ALB: "enam", AND: "enam",
  AUT: "enam", BLR: "enam",
  BEL: "enam", BIH: "enam",
  BGR: "enam", HRV: "enam",
  CZE: "enam", DNK: "enam",
  EST: "enam", FIN: "enam",
  FRA: "enam", DEU: "enam",
  GRC: "enam", HUN: "enam",
  ISL: "enam", IRL: "enam",
  ITA: "enam", XKX: "enam",
  LVA: "enam", LIE: "enam",
  LTU: "enam", LUX: "enam",
  MLT: "enam", MDA: "enam",
  MCO: "enam", MNE: "enam",
  NLD: "enam", MKD: "enam",
  NOR: "enam", POL: "enam",
  PRT: "enam", ROU: "enam",
  RUS: "enam", SMR: "enam",
  SRB: "enam", SVK: "enam",
  SVN: "enam", ESP: "enam",
  SWE: "enam", CHE: "enam",
  UKR: "enam", GBR: "enam",
  VAT: "enam", CAN: "enam",
  USA: "enam", GRL: "enam",
};

export function isoToRegion(iso3: string): RegionCode | null {
  return REGION_MEMBERSHIP[iso3] ?? null;
}
