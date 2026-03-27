-- Add profile fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "grade" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" VARCHAR(10) DEFAULT 'af';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" TEXT[] DEFAULT '{}';

-- Create math_test_templates table
CREATE TABLE IF NOT EXISTS "math_test_templates" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 4,
    "operations" TEXT[] NOT NULL DEFAULT '{}',
    "time_limit_sec" INTEGER NOT NULL DEFAULT 360,
    "questions_json" JSONB NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 50,
    "language" VARCHAR(10) NOT NULL DEFAULT 'af',
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create math_test_attempts table
CREATE TABLE IF NOT EXISTS "math_test_attempts" (
    "id" SERIAL PRIMARY KEY,
    "template_id" INTEGER NOT NULL REFERENCES "math_test_templates"("id"),
    "player_name" VARCHAR(255) NOT NULL,
    "player_id" VARCHAR(255),
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "time_used_sec" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "answers_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_math_attempts_template" ON "math_test_attempts"("template_id");
CREATE INDEX IF NOT EXISTS "idx_math_attempts_player" ON "math_test_attempts"("player_name");
CREATE INDEX IF NOT EXISTS "idx_math_attempts_player_id" ON "math_test_attempts"("player_id");
CREATE INDEX IF NOT EXISTS "idx_math_attempts_score" ON "math_test_attempts"("score" DESC);
CREATE INDEX IF NOT EXISTS "idx_math_templates_grade" ON "math_test_templates"("grade");
