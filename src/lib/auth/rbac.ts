/**
 * Role matrix mirrored from the RLS policies (docs/adr ADR-002).
 * The database is authoritative; this module gives the UI and route handlers the same answer early.
 */
export const STAFF_ROLES = ['super_admin', 'admin', 'marketing_manager', 'sales_manager', 'content_editor'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  marketing_manager: 'Marketing Manager',
  sales_manager: 'Sales Manager',
  content_editor: 'Content Editor',
};

export type Permission =
  | 'catalog.read' | 'catalog.write' | 'catalog.media'
  | 'crm.read' | 'crm.write' | 'crm.export' | 'crm.delete' | 'sales.approve'
  | 'content.read' | 'content.write' | 'content.approve'
  | 'insights.read' | 'insights.write'
  | 'demo.manage' | 'integrations.manage'
  | 'audit.read' | 'staff.read' | 'staff.manage';

const ALL: StaffRole[] = [...STAFF_ROLES];
const ADMINS: StaffRole[] = ['super_admin', 'admin'];

export const PERMISSIONS: Record<Permission, StaffRole[]> = {
  'catalog.read': ALL,
  'catalog.write': ADMINS,
  'catalog.media': ['super_admin', 'admin', 'marketing_manager', 'content_editor'],
  'crm.read': ['super_admin', 'admin', 'sales_manager', 'marketing_manager'],
  'crm.write': ['super_admin', 'admin', 'sales_manager'],
  'crm.export': ['super_admin', 'admin', 'sales_manager'],
  'crm.delete': ADMINS,
  'sales.approve': ADMINS,
  'content.read': ['super_admin', 'admin', 'marketing_manager', 'content_editor'],
  'content.write': ['super_admin', 'admin', 'marketing_manager', 'content_editor'],
  'content.approve': ['super_admin', 'admin', 'marketing_manager'],
  'insights.read': ['super_admin', 'admin', 'marketing_manager', 'sales_manager'],
  'insights.write': ['super_admin', 'admin', 'marketing_manager'],
  'demo.manage': ADMINS,
  'integrations.manage': ADMINS,
  'audit.read': ADMINS,
  'staff.read': ADMINS,
  'staff.manage': ['super_admin'],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  return !!role && PERMISSIONS[permission].includes(role);
}

/** Admin navigation, filtered by permission. */
export const ADMIN_NAV: { label: string; href: string; permission: Permission; icon: string }[] = [
  { label: 'Overview', href: '/admin', permission: 'catalog.read', icon: 'LayoutDashboard' },
  { label: 'Products', href: '/admin/products', permission: 'catalog.read', icon: 'Boxes' },
  { label: 'Categories', href: '/admin/categories', permission: 'catalog.read', icon: 'FolderTree' },
  { label: 'Integrations', href: '/admin/integrations', permission: 'catalog.read', icon: 'Activity' },
  { label: 'Demo Sessions', href: '/admin/demo', permission: 'demo.manage', icon: 'ShieldCheck' },
  { label: 'Leads & CRM', href: '/admin/leads', permission: 'crm.read', icon: 'Users' },
  { label: 'Sales & Quotes', href: '/admin/sales', permission: 'crm.read', icon: 'Receipt' },
  { label: 'Content Studio', href: '/admin/content', permission: 'content.read', icon: 'Wand2' },
  { label: 'Articles', href: '/admin/articles', permission: 'content.read', icon: 'Newspaper' },
  { label: 'Testimonials', href: '/admin/testimonials', permission: 'content.read', icon: 'Quote' },
  { label: 'Analytics', href: '/admin/analytics', permission: 'insights.read', icon: 'BarChart3' },
  { label: 'Staff', href: '/admin/staff', permission: 'staff.read', icon: 'UserCog' },
  { label: 'Security', href: '/admin/security', permission: 'audit.read', icon: 'Lock' },
];
