import type { Tab } from "./tabState.js";

export type AppPlatform = "macos" | "windows" | "linux";

export function detectPlatform(): AppPlatform {
  if (typeof navigator === "undefined") {
    return "linux";
  }

  const source = [navigator.platform, navigator.userAgent]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (source.includes("mac")) {
    return "macos";
  }
  if (source.includes("win")) {
    return "windows";
  }
  return "linux";
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getBaseName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || path;
}

export function guessLang(type: string): Tab["lang"] {
  if (type === "json") return "json";
  if (type === "xml") return "xml";
  return "plaintext";
}

export function guessLangFromFilename(filename: string): Tab["lang"] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".xml")) return "xml";
  return "plaintext";
}

export function compressJsonContent(content: string): string {
  return JSON.stringify(JSON.parse(content));
}

export function compressXmlContent(content: string): string {
  return content
    .replace(/>\s+</g, "><")
    .replace(/\n/g, "")
    .trim();
}
