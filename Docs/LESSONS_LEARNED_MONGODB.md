# Zippy v3 Lessons Learned: Prisma & MongoDB Field Drift

## Context
When using Prisma with a strictly typed relational database (like PostgreSQL), deleting a field from `schema.prisma` natively drops it from querying. Running `prisma db push` or `prisma migrate dev` will modify the underlying table structure to drop the column entirely.

However, **MongoDB is a schemaless document store**. When you remove a field from `schema.prisma` and run `npx prisma db push`, Prisma simply stops reading and writing that field via its typed client. **It does not delete the existing data from the underlying MongoDB documents.**

## The Problem: Global Taxonomy Drift
In Zippy v3, the `GlobalTaxonomy` singleton document was originally tracking large arrays of strings (e.g., `vendors`, `purposes`, `wifiStandards`). We decided to migrate these to a separate strategy and deleted them from `schema.prisma` to strictly enforce the "Zero Hardcoding" mandate.

Because the `GlobalTaxonomy` model appropriately includes a catch-all property `extraFields Json?` (to capture user-created dynamic categories), the next time Prisma fetched the taxonomy document, MongoDB returned the orphaned array fields along with the document. Prisma then safely stuffed those unknown fields into `extraFields`.

When the UI rendered the Admin Taxonomy form, it iterated over `extraFields` and displayed all the abandoned schemas, leading to data drift and a cluttered UI that showed fields we thought we had deleted.

## The Solution: Explicit `$unset` in MongoDB
To truly delete fields from existing MongoDB documents using Prisma, you cannot rely on schema deletion. You must explicitly run a raw MongoDB `$unset` mutation on the affected database collection to wipe the orphaned properties from the JSON documents.

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function cleanUpOrphanedFields() {
    await prisma.$runCommandRaw({
        update: "GlobalTaxonomy",
        updates: [
            {
                // Match the specific document (or use {} for all documents)
                q: { slug: "global_taxonomy_v1" },
                u: {
                    // $unset removes the properties from the MongoDB document
                    $unset: {
                        vendors: "",
                        purposes: "",
                        interfaceTypes: "",
                        wifiStandards: "",
                        cellularTypes: "",
                        poeStandards: "",
                        mountingOptions: ""
                    }
                }
            }
        ]
    });
    console.log("Cleaned up orphaned taxonomy properties");
}

cleanUpOrphanedFields()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

## Architect Takeaway
When working in the federated monolith with Zippy v3:
1. **Never assume data is gone in MongoDB just because it is gone from the Prisma Schema.**
2. If relying on catch-all fields like `Json` or `extraFields`, be highly aware that orphaned legacy fields will be absorbed there.
3. Always pair schema field removals with a raw MongoDB `$unset` cleanup script if the collection has existing data.
