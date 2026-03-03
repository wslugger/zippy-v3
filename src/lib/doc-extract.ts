/**
 * Extract plain text from uploaded documents.
 * Supports: PDF, XLSX/XLS/CSV, PPTX, TXT/MD/plain text.
 * @version 2.4.5-fixed
 */

// Polyfill browser globals for pdf-parse in Node.js environments
if (typeof global !== "undefined") {
    if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class DOMMatrix { };
    if (!(global as any).ImageData) (global as any).ImageData = class ImageData { };
    if (!(global as any).Path2D) (global as any).Path2D = class Path2D { };
}

export async function extractText(
    buffer: Buffer,
    mimeType: string,
    fileName?: string
): Promise<string> {
    const lower = (fileName ?? "").toLowerCase();

    // ---- PDF ----
    if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
        try {
            // unpdf requires Uint8Array, not Node Buffer
            const uint8Array = new Uint8Array(buffer);
            const { extractText: extractPdfText } = await import("unpdf");
            const { text } = await extractPdfText(uint8Array);
            // text can be a string or string array (per page)
            const fullText = Array.isArray(text) ? text.join("\n") : text;
            return (fullText || "").trim();
        } catch (err: any) {
            console.error("PDF Extraction Error:", err.message);
            throw err;
        }
    }

    // ---- Spreadsheets (XLSX / XLS / CSV) ----
    if (
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel" ||
        mimeType === "text/csv" ||
        lower.endsWith(".xlsx") ||
        lower.endsWith(".xls") ||
        lower.endsWith(".csv")
    ) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const lines: string[] = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            lines.push(`[Sheet: ${sheetName}]`);
            lines.push(XLSX.utils.sheet_to_csv(sheet));
        }
        return lines.join("\n").trim();
    }

    // ---- PowerPoint (PPTX) — basic XML text extraction ----
    if (
        mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        lower.endsWith(".pptx")
    ) {
        const AdmZip = (await import("adm-zip")).default;
        const zip = new AdmZip(buffer);
        const entries = zip.getEntries();
        const texts: string[] = [];
        for (const entry of entries) {
            if (entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")) {
                const xml = entry.getData().toString("utf-8");
                // Extract text between <a:t>...</a:t> tags
                const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? [];
                texts.push(matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" "));
            }
        }
        return texts.join("\n").trim();
    }

    // ---- Plain text fallback (TXT, MD, etc.) ----
    return buffer.toString("utf-8").trim();
}
