-- Broodz MVP Schema
-- Run against broodz_db on server

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  magic_token VARCHAR(255),
  magic_token_expires TIMESTAMPTZ,
  jwt_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  slug VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  bio TEXT,
  category_id INTEGER REFERENCES categories(id),
  location VARCHAR(255),
  profile_image VARCHAR(500),
  cover_image VARCHAR(500),
  social_links JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  talent_id INTEGER NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  price_label VARCHAR(100),
  duration VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id SERIAL PRIMARY KEY,
  talent_id INTEGER NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  title VARCHAR(255),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  talent_id INTEGER NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_talents_slug ON talents(slug);
CREATE INDEX IF NOT EXISTS idx_talents_category ON talents(category_id);
CREATE INDEX IF NOT EXISTS idx_talents_published ON talents(is_published);
CREATE INDEX IF NOT EXISTS idx_services_talent ON services(talent_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_talent ON portfolio_items(talent_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_talent ON enquiries(talent_id);

-- Seed categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Landscaping', 'landscaping', 'grass', 1),
  ('Tutoring', 'tutoring', 'school', 2),
  ('Art & Design', 'art-design', 'palette', 3),
  ('Photography', 'photography', 'photo_camera', 4),
  ('Music', 'music', 'music_note', 5),
  ('Fitness', 'fitness', 'fitness_center', 6),
  ('Home Services', 'home-services', 'home_repair_service', 7),
  ('Tech', 'tech', 'computer', 8),
  ('Events', 'events', 'celebration', 9),
  ('Other', 'other', 'category', 10)
ON CONFLICT (slug) DO NOTHING;
