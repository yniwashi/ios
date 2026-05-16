// /ambulance/search_data.js
// CHANGELOG (2026-05-16):
// - Add shared helper-data preload and local cache for CPG, SOP, CPM, flowcharts, and formulary.
// - Provide reusable document item and global target access for the app and tool modules.
import { buildDocumentTargets, buildSimplePageTargets, extractItems } from "./search_core.js";

const DEFAULT_CONFIG = {
  urlIndex: "https://docs.niwashibase.com/helpers/cpg_index.json",
  urlSopIndex: "https://docs.niwashibase.com/helpers/sop_index.json",
  urlCpmIndex: "https://docs.niwashibase.com/helpers/cpm_index.json",
  urlFlowcharts: "https://docs.niwashibase.com/helpers/flowcharts.json",
  urlFormulary: "https://docs.niwashibase.com/helpers/formulary.json"
};

const CACHE_KEY = "amb_search_data_v1";
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let config = { ...DEFAULT_CONFIG };
let rawData = null;
let targets = null;
let freshPromise = null;

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached || !cached.rawData || !cached.savedAt) return null;
    if (Date.now() - cached.savedAt > MAX_CACHE_AGE_MS) return null;
    rawData = cached.rawData;
    targets = buildTargets(rawData);
    return rawData;
  } catch (_) {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rawData: data }));
  } catch (_) {}
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

async function fetchFresh() {
  const [cpg, sop, cpm, flowcharts, formulary] = await Promise.all([
    fetchJson(config.urlIndex).catch(() => []),
    fetchJson(config.urlSopIndex).catch(() => ({ items: [] })),
    fetchJson(config.urlCpmIndex).catch(() => ({ items: [] })),
    fetchJson(config.urlFlowcharts).catch(() => ({})),
    fetchJson(config.urlFormulary).catch(() => ({}))
  ]);
  rawData = { cpg, sop, cpm, flowcharts, formulary };
  targets = buildTargets(rawData);
  writeCache(rawData);
  return rawData;
}

function buildTargets(data) {
  return [
    ...buildDocumentTargets(data.cpg || [], "cpg"),
    ...buildDocumentTargets(data.sop || { items: [] }, "sop"),
    ...buildDocumentTargets(data.cpm || { items: [] }, "cpm"),
    ...buildSimplePageTargets(data.flowcharts || {}, "flowchart", { pillLabel: "Flowchart" }),
    ...buildSimplePageTargets(data.formulary || {}, "formulary", { pillLabel: "Formulary" })
  ];
}

export function configureSearchData(nextConfig = {}) {
  config = { ...config, ...nextConfig };
}

export function preloadSearchData(nextConfig = {}) {
  configureSearchData(nextConfig);
  if (!rawData) readCache();
  if (!freshPromise) freshPromise = fetchFresh().finally(() => { freshPromise = null; });
  return rawData ? Promise.resolve(rawData) : freshPromise;
}

export async function getSearchData(nextConfig = {}) {
  configureSearchData(nextConfig);
  if (rawData) return rawData;
  const cached = readCache();
  if (cached) {
    preloadSearchData().catch(() => {});
    return cached;
  }
  if (!freshPromise) freshPromise = fetchFresh().finally(() => { freshPromise = null; });
  return freshPromise;
}

export async function getGlobalDocumentTargets(nextConfig = {}) {
  await getSearchData(nextConfig);
  return targets || [];
}

export async function getDocumentItems(type, nextConfig = {}) {
  await getSearchData(nextConfig);
  const data = rawData && rawData[type];
  return extractItems(data || []);
}
