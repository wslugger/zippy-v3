import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PROMPTS = [
    {
        slug: "package_selection",
        displayName: "Package Selection",
        model: "gemini-3-flash-preview",
        temperature: 0.1,
        systemInstruction: "You are a Solutions Architect expert.",
        userPromptTemplate: `Analyze the following Customer Requirements and recommend the BEST fitting package from the available options.

AVAILABLE PACKAGES:
{packageSummaries}

{requirementsTextSection}

Output strictly in JSON format:
{
  "packageId": "string (must match one of the available IDs)",
  "confidence": number (0-100),
  "reasoning": "string (concise explanation)"
}`,
    },
];

async function main() {
    console.log("Seeding AI Prompts...");
    for (const prompt of DEFAULT_PROMPTS) {
        await prisma.aIPrompt.upsert({
            where: { slug: prompt.slug },
            update: {},
            create: prompt,
        });
        console.log(`  ✔ Upserted prompt: ${prompt.slug}`);
    }
    console.log("Done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
