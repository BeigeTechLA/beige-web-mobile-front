export const ADMIN_PERMISSION_MENU_HIERARCHY: Record<
  string,
  { label: string; children: string[] }
> = {
  admin_sales_representative: {
    label: "Sales Representative",
    children: [
      "admin_sales_representative_dashboard",
      "admin_sales_representative_shift_management",
    ],
  },
  admin_finances: {
    label: "Finances",
    children: [
      "admin_finances_transactions",
      "admin_finances_disputes",
      "admin_finances_beige_credit_points",
      "admin_finances_cp_compensation",
    ],
  },
  admin_users: {
    label: "Users",
    children: [
      "admin_users_all_users",
      "admin_users_clients",
      "admin_users_creative_partners",
    ],
  },
  admin_quotes: {
    label: "Quotes",
    children: [
      "admin_quotes_all_quotes",
      "admin_quotes_quote_approvals",
      "admin_quotes_master_pricing",
    ],
  },
};
