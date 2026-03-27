-- Children table (linked to parent via auth user UUID)
CREATE TABLE IF NOT EXISTS "children" (
    "id" SERIAL PRIMARY KEY,
    "parent_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "birthdate" DATE NOT NULL,
    "age" INTEGER,
    "grade" INTEGER NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'af',
    "play_slug" VARCHAR(100) NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name_en" VARCHAR(255) NOT NULL,
    "name_af" VARCHAR(255) NOT NULL,
    "name_tn" VARCHAR(255),
    "grades" INTEGER[] NOT NULL DEFAULT '{}',
    "test_types" TEXT[] NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Child-subject mapping
CREATE TABLE IF NOT EXISTS "child_subjects" (
    "id" SERIAL PRIMARY KEY,
    "child_id" INTEGER NOT NULL REFERENCES "children"("id") ON DELETE CASCADE,
    "subject_id" INTEGER NOT NULL REFERENCES "subjects"("id"),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("child_id", "subject_id")
);

-- POPIA consent tracking
CREATE TABLE IF NOT EXISTS "parent_consent" (
    "id" SERIAL PRIMARY KEY,
    "parent_id" VARCHAR(255) NOT NULL UNIQUE,
    "popia_accepted" BOOLEAN NOT NULL DEFAULT false,
    "accepted_at" TIMESTAMPTZ,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add child_id to attempts
ALTER TABLE "math_test_attempts" ADD COLUMN IF NOT EXISTS "child_id" INTEGER;

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_children_parent" ON "children"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_children_slug" ON "children"("play_slug");
CREATE INDEX IF NOT EXISTS "idx_child_subjects_child" ON "child_subjects"("child_id");
CREATE INDEX IF NOT EXISTS "idx_math_attempts_child" ON "math_test_attempts"("child_id");

-- Seed: Mathematics subject
INSERT INTO "subjects" ("code", "name_en", "name_af", "name_tn", "grades", "test_types")
VALUES ('maths', 'Mathematics', 'Wiskunde', 'Mmetse', '{1,2,3,4,5,6,7,8,9,10,11,12}', '{speed,problem_solving}')
ON CONFLICT ("code") DO NOTHING;
