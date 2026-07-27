import { hashPassword } from './password-utils';

export interface StaffAccount {
  id: string;
  full_name: string;
  username: string;
  password_hash: string;
  phone: string;
  email: string;
  role: string;
  branch: string;
  status: 'Active' | 'Inactive';
  last_login?: string;
  permissions: string[];
  avatar_url?: string;
  created_at?: string;
}

const defaultStaffAccounts: StaffAccount[] = [
  {
    id: 'staff-1',
    full_name: 'Aryan Rathod',
    username: 'aryan',
    password_hash: hashPassword('aryan123'),
    phone: '9316688014',
    email: 'aryan@mehtadairy.com',
    role: 'Administrator',
    branch: 'Main Branch',
    status: 'Active',
    last_login: new Date().toISOString(),
    permissions: ['ALL'],
    created_at: new Date().toISOString()
  },
  {
    id: 'staff-2',
    full_name: 'Babli Mehta',
    username: 'babli',
    password_hash: hashPassword('babli@1972'),
    phone: '9876543212',
    email: 'babli@mehtadairy.com',
    role: 'Store Manager',
    branch: 'Main Branch',
    status: 'Active',
    last_login: new Date(Date.now() - 3600000).toISOString(),
    permissions: ['dashboard', 'orders', 'whatsapp_orders', 'invoices', 'customers', 'reports'],
    created_at: new Date().toISOString()
  },
  {
    id: 'staff-3',
    full_name: 'Ramesh Patel',
    username: 'ramesh',
    password_hash: hashPassword('ramesh123'),
    phone: '9825012345',
    email: 'ramesh@mehtadairy.com',
    role: 'Cashier',
    branch: 'Taleti Branch',
    status: 'Active',
    last_login: new Date(Date.now() - 7200000).toISOString(),
    permissions: ['orders', 'invoices', 'customers', 'print_receipts', 'generate_invoice'],
    created_at: new Date().toISOString()
  },
  {
    id: 'staff-4',
    full_name: 'Suresh Parmar',
    username: 'suresh',
    password_hash: hashPassword('suresh123'),
    phone: '9909098765',
    email: 'suresh@mehtadairy.com',
    role: 'Packing Staff',
    branch: 'Main Branch',
    status: 'Active',
    last_login: new Date(Date.now() - 14400000).toISOString(),
    permissions: ['orders', 'update_order_status', 'print_agent'],
    created_at: new Date().toISOString()
  }
];

const globalForStaff = globalThis as unknown as {
  staffAccountsStore: StaffAccount[] | undefined;
};

if (!globalForStaff.staffAccountsStore) {
  globalForStaff.staffAccountsStore = [...defaultStaffAccounts];
}

export const getSharedStaffStore = (): StaffAccount[] => {
  return globalForStaff.staffAccountsStore || defaultStaffAccounts;
};

export const addStaffToStore = (staff: StaffAccount) => {
  const store = getSharedStaffStore();
  const index = store.findIndex(s => s.id === staff.id || s.username === staff.username);
  if (index >= 0) {
    store[index] = { ...store[index], ...staff };
  } else {
    store.unshift(staff);
  }
};

export const updateStaffInStore = (id: string, updates: Partial<StaffAccount>) => {
  const store = getSharedStaffStore();
  const index = store.findIndex(s => s.id === id);
  if (index >= 0) {
    store[index] = { ...store[index], ...updates };
    return store[index];
  }
  return null;
};

export const deleteStaffFromStore = (id: string) => {
  const store = getSharedStaffStore();
  const index = store.findIndex(s => s.id === id);
  if (index >= 0) {
    store.splice(index, 1);
  }
};
