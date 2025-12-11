-- Drop the incorrect constraint that only allows one meal per day per child
-- We need the constraint to be on (date, profile_id, child_id, meal_time) which already exists
ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_date_profile_id_child_id_key;