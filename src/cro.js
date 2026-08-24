export const CRO_TEST_SEARCHES = Object.freeze(["Ryanair", "Google", "83740"]);

export function validateCroQuery(value) {
  const query = String(value || "").trim();
  if (query.length < 2) return "Enter at least 2 characters or a CRO number.";
  if (query.length > 120) return "Keep the search to 120 characters or fewer.";
  return "";
}

export function formatCroDate(value) {
  if (!value || String(value).startsWith("0001-01-01")) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function croAddress(company = {}) {
  const addressLines = [company.company_addr_1, company.company_addr_2, company.company_addr_3, company.company_addr_4]
    .map((part) => String(part || "").trim())
    .filter((part, index, parts) => part && parts.indexOf(part) === index);
  const eircode = String(company.eircode || "").trim();
  if (eircode && !addressLines.some((line) => line.toLowerCase().includes(eircode.toLowerCase()))) addressLines.push(eircode);
  return addressLines.join(", ") || "Not recorded";
}

export function normaliseCroResults(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((company) => company && company.company_num && company.company_name);
}
