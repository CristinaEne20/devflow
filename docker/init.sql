-- Trigram index support for ILIKE '%term%' issue search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Separate database for integration tests.
CREATE DATABASE devflow_test;
\connect devflow_test
CREATE EXTENSION IF NOT EXISTS pg_trgm;
