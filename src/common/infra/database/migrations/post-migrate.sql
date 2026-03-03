-- Post-migration script: Add partial unique indexes for polymorphic relations
-- Run this after `pnpm db:migrate`

-- Ensure each user can only have one actor (polymorphic relation)
CREATE UNIQUE INDEX IF NOT EXISTS actors_user_id_unique_idx
ON actors(user_id)
WHERE user_id IS NOT NULL;

-- Ensure each organization can only have one actor (polymorphic relation)
CREATE UNIQUE INDEX IF NOT EXISTS actors_organization_id_unique_idx
ON actors(organization_id)
WHERE organization_id IS NOT NULL;
