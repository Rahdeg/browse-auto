import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * Clerk owns users and organizations, so we only store its string identifiers
 * (`user_...`, `org_...`) rather than mirroring those tables here.
 */
export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("workflows_organization_id_idx").on(table.organizationId)]
)

export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert
