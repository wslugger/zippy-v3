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
Every time an AI feature (LLM call) is added or modified in the Zippy v3 platform, it **must** be registered and managed through the central **AI Prompts Control** page (`/settings/prompts`).

1. **Do not hardcode prompts:** All system instructions and user prompt templates must be fetched from the `AIPrompt` database model.
2. **Setup a new Prompt:** If you are building a new AI feature, create a new tab in `src/app/(sa)/settings/prompts/_components/prompts-form.tsx` and define its expected dynamically injected `TEMPLATE_VARIABLES`.
3. **Fallback Logic:** Ensure your API routes have a sensible fallback defined in code in case the `AIPrompt` database record is missing (to prevent complete feature failure during initial deployment).
