-- Seed Maggie Senyatsi's profile (beta tester)
-- Run after schema.sql against broodz_db

INSERT INTO users (email, name) VALUES ('maggie@example.com', 'Maggie Senyatsi')
ON CONFLICT (email) DO NOTHING;

INSERT INTO talents (user_id, slug, name, tagline, bio, category_id, location, profile_image, cover_image, social_links, is_published, is_beta)
SELECT
  u.id,
  'maggie-senyatsi',
  'Maggie Senyatsi',
  'Maggie Senyatsi''s Curated Greenery',
  'I''m a young landscaper from Johannesburg with a passion for transforming outdoor spaces into beautiful, living gardens. I believe everyone deserves a green space — no matter how small. Let me help you bring your garden dreams to life!',
  c.id,
  'Johannesburg, Gauteng',
  NULL,
  NULL,
  '{"instagram": "https://instagram.com/maggie.plants", "whatsapp": "https://wa.me/27000000000", "tiktok": "https://tiktok.com/@maggie.plants"}',
  true,
  true
FROM users u, categories c
WHERE u.email = 'maggie@example.com' AND c.slug = 'landscaping'
ON CONFLICT (slug) DO NOTHING;

-- Sample services
INSERT INTO services (talent_id, name, description, price, price_label, duration, sort_order)
SELECT t.id, 'Garden Design Consultation', 'I''ll visit your space, understand your vision, and create a personalised garden design plan.', 350, NULL, '1-2 hours', 0
FROM talents t WHERE t.slug = 'maggie-senyatsi'
ON CONFLICT DO NOTHING;

INSERT INTO services (talent_id, name, description, price, price_label, duration, sort_order)
SELECT t.id, 'Plant Selection & Sourcing', 'I''ll help you choose the right plants for your climate, soil, and style — and source them for you.', NULL, 'From R200', 'Varies', 1
FROM talents t WHERE t.slug = 'maggie-senyatsi'
ON CONFLICT DO NOTHING;

INSERT INTO services (talent_id, name, description, price, price_label, duration, sort_order)
SELECT t.id, 'Garden Maintenance', 'Regular garden care — pruning, weeding, watering schedules, seasonal planting.', 500, NULL, 'Per visit', 2
FROM talents t WHERE t.slug = 'maggie-senyatsi'
ON CONFLICT DO NOTHING;
