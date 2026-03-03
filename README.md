This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI Prompt Management

**CRITICAL DEVELOPMENT RULE:**
Every AI feature (LLM call) added to Zippy v3 **must** be managed via the **AI Prompts Control** page (`/settings/prompts`).

1. **No Hardcoded Prompts:** Fetch all system instructions and templates from the `AIPrompt` model.
2. **Mandatory Registration:** Add a new tab in `src/app/(sa)/settings/prompts/_components/prompts-form.tsx` for every unique LLM use case.
3. **Strict JSON Mode:** Always set `responseMimeType: "application/json"` in `callGemini` to prevent "chatty" responses from breaking parsers.
4. **Key Normalization:** Implement fallback keys in your parser (e.g., `data.execSummary || data.exec_summary`) to handle model naming fluctuations.
5. **Safe Fallbacks:** Always define a "code fallback" prompt configuration in your API route so the feature works even if the database hasn't been seeded yet.
