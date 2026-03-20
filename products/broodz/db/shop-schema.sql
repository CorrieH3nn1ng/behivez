-- Broodz Shop Schema — Products table
-- Run against broodz_db on server

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  talent_id INTEGER NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  price_label VARCHAR(100),
  image_url VARCHAR(500),
  in_stock BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_talent ON products(talent_id);

-- Extend portfolio_items to support social embeds
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS platform VARCHAR(20);

-- Update type constraint to allow 'embed'
ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_type_check;
ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_type_check
  CHECK (type IN ('image', 'video', 'embed'));

-- Add theme column to talents
ALTER TABLE talents ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'earth';

-- Add contact fields to talents
ALTER TABLE talents ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
