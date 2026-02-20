export function detectPlatform() {
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
export function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
export function getBaseName(path) {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || path;
}
export function guessLang(type) {
    if (type === "json")
        return "json";
    if (type === "xml")
        return "xml";
    return "plaintext";
}
export function guessLangFromFilename(filename) {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".json"))
        return "json";
    if (lower.endsWith(".xml"))
        return "xml";
    return "plaintext";
}
export function compressJsonContent(content) {
    return JSON.stringify(JSON.parse(content));
}
export function compressXmlContent(content) {
    return content
        .replace(/>\s+</g, "><")
        .replace(/\n/g, "")
        .trim();
}
