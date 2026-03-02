import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding process skipped. Catalog is managed via UI.');

    // Ensure at least the global taxonomy exists if it's required for the app to function
    // but keep it minimal or based on existing data.

    const existingTaxonomy = await prisma.globalTaxonomy.findUnique({
        where: { type: 'global' }
    });

    if (!existingTaxonomy) {
        console.log('Initializing empty Global Taxonomy...');
        await prisma.globalTaxonomy.create({
            data: {
                type: 'global',
                data: {
                    vendors: [],
                    interfaceTypes: [],
                    wifiStandards: [],
                },
            },
        });
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
