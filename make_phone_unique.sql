-- SQL Migration: Enforce UNIQUE constraint on public.customers.phone
-- 1. Delete duplicate customer records keeping only one row per phone (the oldest ctid)
DELETE FROM public.customers
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM public.customers
    GROUP BY phone
);

-- 2. Add unique constraint to phone column
ALTER TABLE public.customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);
