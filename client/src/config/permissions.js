export const PERMISSIONS = {
  CASHIER: 'cashier',
  INVENTORY_VIEW: 'inventory_view',
  INVENTORY_MANAGE: 'inventory_manage',
  EMPLOYEE_VIEW: 'employee_view',
  EMPLOYEE_MANAGE: 'employee_manage',
  REPORT_VIEW: 'report_view',
  REPORT_EXPORT: 'report_export',
  PRODUCT_VIEW: 'product_view',
  PRODUCT_MANAGE: 'product_manage',
  ATTENDANCE_VIEW: 'attendance_view',
  ATTENDANCE_MANAGE: 'attendance_manage',
  CUSTOMER_VIEW: 'customer_view',
  CUSTOMER_MANAGE: 'customer_manage',
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_MANAGE: 'settings_manage'
};

export const PERMISSION_GROUPS = [
  {
    key: 'cashier',
    name: '收银',
    icon: '💰',
    permissions: ['cashier', 'product_view']
  },
  {
    key: 'inventory',
    name: '库存管理',
    icon: '📦',
    permissions: ['inventory_view', 'inventory_manage']
  },
  {
    key: 'employee',
    name: '员工管理',
    icon: '👥',
    permissions: ['employee_view', 'employee_manage']
  },
  {
    key: 'report',
    name: '报表统计',
    icon: '📊',
    permissions: ['report_view', 'report_export']
  },
  {
    key: 'product',
    name: '商品管理',
    icon: '🏪',
    permissions: ['product_view', 'product_manage']
  },
  {
    key: 'attendance',
    name: '考勤管理',
    icon: '📅',
    permissions: ['attendance_view', 'attendance_manage']
  },
  {
    key: 'customer',
    name: '客户管理',
    icon: '🤝',
    permissions: ['customer_view', 'customer_manage']
  },
  {
    key: 'settings',
    name: '系统设置',
    icon: '⚙️',
    permissions: ['settings_view', 'settings_manage']
  }
];

export const PERMISSION_DETAILS = {
  cashier: {
    label: '收银权限',
    description: '允许进行收银操作'
  },
  inventory_view: {
    label: '查看库存',
    description: '查看库存数据和报表'
  },
  inventory_manage: {
    label: '管理库存',
    description: '添加、编辑、删除库存'
  },
  employee_view: {
    label: '查看员工',
    description: '查看员工列表和信息'
  },
  employee_manage: {
    label: '管理员工',
    description: '添加、编辑、删除员工'
  },
  report_view: {
    label: '查看报表',
    description: '查看各类经营报表'
  },
  report_export: {
    label: '导出报表',
    description: '导出报表数据'
  },
  product_view: {
    label: '查看商品',
    description: '查看商品列表'
  },
  product_manage: {
    label: '管理商品',
    description: '添加、编辑、删除商品'
  },
  attendance_view: {
    label: '查看考勤',
    description: '查看员工考勤记录'
  },
  attendance_manage: {
    label: '管理考勤',
    description: '编辑和管理考勤'
  },
  customer_view: {
    label: '查看客户',
    description: '查看客户信息'
  },
  customer_manage: {
    label: '管理客户',
    description: '添加、编辑、删除客户'
  },
  settings_view: {
    label: '查看设置',
    description: '查看系统设置'
  },
  settings_manage: {
    label: '管理设置',
    description: '修改系统设置'
  }
};

export const DEFAULT_PERMISSIONS = ['cashier', 'product_view'];
