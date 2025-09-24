-- Add the missing construction categories to match the original MySQL schema
-- This will add all 12 categories from the original application

-- First, add all the new categories
INSERT INTO categories (name, description, sort_order) VALUES
    ('Material', 'Basic construction materials', 1),
    ('Labor', 'Worker payments and contractor fees', 2),
    ('Masonry', 'Brick work, concrete, foundations', 3),
    ('Steel Works', 'Reinforcement, structural steel', 4),
    ('Plumbing', 'Pipes, fixtures, installation', 5),
    ('Carpentry', 'Wood work, formwork, finishing', 6),
    ('Electrical Works', 'Wiring, fixtures, installations', 7),
    ('Air Conditioning Works', 'HVAC systems', 8),
    ('Utilities', 'Water, electricity connections', 9),
    ('Glass Glazing', 'Windows, glass installations', 10),
    ('Metal Works', 'Gates, railings, metal fixtures', 11),
    ('POP/Aesthetics Works', 'Finishing, decorative elements', 12)
ON CONFLICT (name) DO NOTHING;

-- Display all categories to verify
SELECT * FROM categories ORDER BY sort_order, name;