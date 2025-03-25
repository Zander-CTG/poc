/* Items and support tables
 
Items are the core of the FleaVision database, set up for robust search, 
and organized by categories and tags. An item is physically organized into a booth, which itself is part of a larger vendor
*/ 

-- Table: `items`  (Main Inventory Table)
-- Primary table to store any searchable item. Items could be detected and generated -- with AI, or manually input via CMS
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    booth_id BIGINT REFERENCES booths(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    visible_text TEXT,
    material TEXT,
    price NUMERIC,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_id TEXT REFERENCES image_metadata(image_id),
    search_vector TSVECTOR,
    -- image reference
    ai_metadata JSONB,
    created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
    updated_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
    last_seen TIMESTAMPZ
);

-- Table: `tags` and `categories`  (Searchable Item Attributes)

-- Categories are simple terms to help with search, from a well defined list of options. Normalized
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    label TEXT UNIQUE NOT NULL
);

CREATE TABLE item_categories (
    item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, category_id)
);


-- Tags are simple words to help with search, there is no specific dictionary for possible tags. Normalized
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    label TEXT UNIQUE NOT NULL
);

CREATE TABLE item_tags (
    item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

-- Table: `image_metadata`  (Raw AI Output & Image Details)
-- Stores metadata and raw AI-extracted JSON responses for future reprocessing.
CREATE TABLE image_metadata (
    image_id TEXT NOT NULL, -- The unique ID for the image. Stored as TEXT because this may come from an external source, and not PRIMARY KEY because we may store processing versions
    processing_id SERIAL PRIMARY KEY, -- Unique ID for each AI processing event
    image_url TEXT,
    upload_timestamp TIMESTAMPZ,
    raw_json JSONB
);

-- Triggers

-- Automatically populate the search_vector column from item names and descriptions, use a trigger:
CREATE OR REPLACE FUNCTION items_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english', coalesce(NEW.label, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_search_vector_trigger
BEFORE INSERT OR UPDATE ON items
FOR EACH ROW EXECUTE PROCEDURE items_search_vector_update();

-- Indexes

-- For full text queries
CREATE INDEX idx_items_search_vector ON items USING GIN (search_vector); 

-- For Fuzzy Searches
CREATE INDEX idx_items_label_trgm ON items USING GIN(label gin_trgm_ops); 
CREATE INDEX idx_tags_label_trgm ON tags USING GIN (label gin_trgm_ops);



/* Booths, Vendors, and Organizations

Items can be physically located in a booth, which is most often part of the larger vendor. 

A vendor is the physical establishment a user could visit. Organizations are reserved for large entities that may have many vendors under one umbrella. All of these are also associated with an owner (person)

*/

CREATE TABLE vendors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id BIGINT REFERENCES organizations(id);
    created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booths (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT REFERENCES vendors(id) ON DELETE CASCADE,
    booth_reference TEXT NOT NULL, -- Unique within a vendor
    description TEXT, -- Optional
    created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    street_address_1 TEXT,
    street_address_2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    created_at TIMESTAMPZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes and performance considerations

-- **Index on `tags(tag)`** for fast lookup of items by tags.
-- **Full-text search potential:** Use PostgreSQL’s `tsvector` for improved searchability.
-- **JSONB indexing:** Consider `GIN` indexing for specific fields inside `raw_json`.

CREATE INDEX raw_json_idx ON image_metadata USING gin (raw_json);