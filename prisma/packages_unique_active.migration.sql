-- Ensure only one active package exists per tier (basic/pro/enterprise)
-- Exclude credits so multiple credit SKUs can coexist
CREATE UNIQUE INDEX IF NOT EXISTS uk_packages_plan_type_active
ON packages (plan_type)
WHERE is_active = true AND plan_type IN ('basic','pro','enterprise');

