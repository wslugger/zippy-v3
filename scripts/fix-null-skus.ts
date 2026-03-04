import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up equipment with missing SKUs...')
    const result1 = await prisma.$runCommandRaw({
        delete: 'equipment',
        deletes: [{ q: { sku: { $exists: false } }, limit: 0 }]
    })
    console.log('Equipment delete result:', result1)

    const result2 = await prisma.$runCommandRaw({
        delete: 'equipment',
        deletes: [{ q: { sku: null }, limit: 0 }]
    })
    console.log('Equipment delete null result:', result2)

    const result3 = await prisma.$runCommandRaw({
        delete: 'licenses',
        deletes: [{ q: { sku: { $exists: false } }, limit: 0 }]
    })
    console.log('Licenses delete result:', result3)

    const result4 = await prisma.$runCommandRaw({
        delete: 'prices',
        deletes: [{ q: { sku: { $exists: false } }, limit: 0 }]
    })
    console.log('Prices delete result:', result4)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
