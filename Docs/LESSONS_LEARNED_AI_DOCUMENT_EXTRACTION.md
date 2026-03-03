# Zippy v3 Lessons Learned: AI Integration & Document Extraction

## Context
Implementing the AI Package Assistant required integrating Google's Gemini API and a server-side document extraction pipeline (PDF, Excel, Powerpoint) within a Next.js (App Router) environment running on Turbopack/Vercel-like architecture.

## 1. AI Model Availability & Drift
### The Problem
Google Generative AI models (Gemini) are subject to rapid deprecation and availability changes. Using specific model versions directly in code (e.g., `gemini-2.0-flash`) can lead to immediate 404 "Model Not Found" errors if Google retires that preview version or restricts it to specific regions/users.

### The Solution
- **Dynamic Configuration**: Store the target model in the database (via the `AIPrompt` model) rather than hardcoding it in the API logic.
- **Fail-safe Defaults**: Always implement a robust fallback model (currently `gemini-1.5-flash` or `gemini-3-flash-preview`) in the code to ensure the service remains operational even if the database configuration becomes stale.
- **Prompt Catalog**: Provide an administrative UI to update models and prompt templates without needing code redeployments.

## 2. Server-Side PDF Extraction Hurdles
### The Problem: Virtual Workers & Dynamic Imports
Traditional PDF parsing libraries (like `pdf-parse`) often rely on legacy `pdf.js` configurations that attempt to spawn background workers or use `require` calls with dynamic expressions.
- **Turbopack Compatibility**: Next.js debug/build servers (especially with Turbopack) fail when a library tries to `require` a module using a dynamic path (e.g., `Setting up fake worker failed: "Cannot find module as expression is too dynamic"`).
- **Environment Polyfills**: Many PDF parsers expect a browser-like environment (e.g., `DOMMatrix`, `ImageData`, `Path2D`). In Node.js, these must be polyfilled explicitly at the module level *before* the library is loaded.

### The Problem: Binary Data Consistency
Different libraries have strict and varying requirements for binary input. Node.js `Buffer` objects are not always interchangeable with `Uint8Array`.
- `unpdf` specifically triggers a runtime error if passed a Node `Buffer`, requiring an explicit conversion: `new Uint8Array(buffer)`.

### The Solution: The `unpdf` Strategy
We transitioned from `pdf-parse` to `unpdf` for the following reasons:
1. **App Router Friendly**: It is built for modern JS environments and works without spawning complex workers that break in Next.js.
2. **Standardized Extraction**: It returns a clean array of strings (one per page) which is easier to sanitize for AI prompts than raw stream outputs.
3. **Lightweight**: Avoids the "bloat" of browser-specific polyfills while maintaining high accuracy for text layers.

## Architect Takeaway
When building AI features in Zippy v3:
1. **Model Agnosticism**: Never hardcode a specific model version deep in the business logic; treat it as a configurable parameter.
2. **Extraction as a Service**: Treat document extraction as a volatile utility. Isolate it in a `lib` file with its own error handling to prevent one corrupt file from crashing the recommendation engine.
3. **Favor Modern Wrappers**: For PDF processing in Next.js, prefer modern, ESM-first libraries like `unpdf` over legacy CJS libraries that depend on `pdf.js` workers.
