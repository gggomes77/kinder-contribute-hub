-- Add indexes for performance optimization on frequently queried columns

-- Indexes for family_id (used in filtering and joins)
CREATE INDEX IF NOT EXISTS idx_time_contributions_family_id ON time_contributions(family_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_family_id ON task_assignments(family_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_assignments_family_id ON cleaning_assignments(family_id);

-- Indexes for date columns (used in filtering and ordering)
CREATE INDEX IF NOT EXISTS idx_time_contributions_date ON time_contributions(date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_cleaning_slots_date ON cleaning_slots(date);

-- Indexes for created_at (used in ordering)
CREATE INDEX IF NOT EXISTS idx_time_contributions_created_at ON time_contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Indexes for foreign key relationships
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_assignments_slot_id ON cleaning_assignments(cleaning_slot_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_time_contributions_family_date ON time_contributions(family_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_date_created ON tasks(date, created_at DESC);