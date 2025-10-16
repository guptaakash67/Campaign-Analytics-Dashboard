-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Paused')),
    clicks INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    impressions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 10 sample campaigns
INSERT INTO campaigns (campaign_name, status, clicks, cost, impressions) VALUES
    ('Summer Sale 2024', 'Active', 15420, 2340.50, 125000),
    ('Black Friday Promo', 'Active', 28900, 4250.75, 310000),
    ('Holiday Campaign', 'Paused', 8750, 1200.00, 95000),
    ('Spring Collection Launch', 'Active', 12300, 1890.25, 102000),
    ('Back to School', 'Paused', 5600, 850.00, 68000),
    ('New Year Special', 'Active', 19800, 3120.80, 215000),
    ('Valentine Day Deals', 'Paused', 7200, 980.50, 72000),
    ('Product Launch Q3', 'Active', 22100, 3680.00, 245000),
    ('Clearance Sale', 'Active', 11500, 1540.30, 98000),
    ('Email Retargeting Campaign', 'Paused', 3400, 520.00, 45000);

-- Verify data
SELECT * FROM campaigns;