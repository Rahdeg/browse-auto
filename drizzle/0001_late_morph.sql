ALTER TABLE "workflows" RENAME COLUMN "organization_id" TO "org_id";--> statement-breakpoint
ALTER TABLE "workflows" RENAME COLUMN "created_by" TO "graph";--> statement-breakpoint
DROP INDEX "workflows_organization_id_idx";--> statement-breakpoint
CREATE INDEX "workflows_org_id_idx" ON "workflows" USING btree ("org_id");