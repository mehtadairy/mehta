require('dotenv').config();

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_ANON_KEY || '').replace(/['"]/g, '').trim();
const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(/['"]/g, '').trim();
const API_KEY = (process.env.API_KEY || '').replace(/['"]/g, '').trim();
const BRANCH_ID = (process.env.BRANCH_ID || 'Main').replace(/['"]/g, '').trim();
const PRINT_COPIES = parseInt((process.env.PRINT_COPIES || '1').replace(/['"]/g, '').trim(), 10);

const PAPER_WIDTH = (process.env.PAPER_WIDTH || '80mm').replace(/['"]/g, '').trim();

const printerMap = {
  'billing': process.env.PRINTER_BILLING,
  'kitchen': process.env.PRINTER_KITCHEN,
  'packing': process.env.PRINTER_PACKING
};

module.exports = {
  SUPABASE_URL,
  SUPABASE_KEY,
  API_URL,
  API_KEY,
  BRANCH_ID,
  PRINT_COPIES,
  PAPER_WIDTH,
  printerMap
};
