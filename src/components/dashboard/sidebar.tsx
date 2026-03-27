'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Database, 
  Users, 
  FileText, 
  Map, 
  UserCog, 
  Building2, 
  Settings, 
  FileBarChart, 
  History,
  HandHeart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Home,
  User,
  UserCheck,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  desaName?: string;
  desaLogo?: string | null;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { 
    id: 'kependudukan', 
    label: 'Kependudukan', 
    icon: Users,
    children: [
      { id: 'data-kk', label: 'Data KK', icon: Home },
      { id: 'data-penduduk', label: 'Data Penduduk', icon: User },
      { id: 'pendatang-sementara', label: 'Pendatang Sementara', icon: UserCheck },
      { id: 'peristiwa-kependudukan', label: 'Peristiwa Kependudukan', icon: Calendar },
      { id: 'monitoring-data', label: 'Monitoring Data', icon: BarChart3 },
    ]
  },
  { id: 'bansos', label: 'Bansos', icon: HandHeart },
  { id: 'dhkp-pbb', label: 'DHKP PBB', icon: FileText },
  { id: 'gis', label: 'GIS', icon: Map },
  { 
    id: 'pengaturan', 
    label: 'Pengaturan', 
    icon: Settings,
    children: [
      { id: 'master-data', label: 'Master Data', icon: Database },
      { id: 'user', label: 'User / Pengguna', icon: UserCog },
      { id: 'pengaturan-desa', label: 'Pengaturan Desa', icon: Building2 },
      { id: 'pengaturan-aplikasi', label: 'Pengaturan Aplikasi', icon: Settings },
    ]
  },
  { id: 'laporan', label: 'Laporan', icon: FileBarChart },
  { id: 'log-aktivitas', label: 'Log Aktivitas', icon: History },
];

export function Sidebar({ 
  activeMenu, 
  onMenuChange, 
  onLogout, 
  userName, 
  userRole,
  collapsed,
  onCollapsedChange,
  desaName,
  desaLogo
}: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['pengaturan', 'kependudukan']);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      if (!collapsed) {
        toggleSubmenu(item.id);
      }
    } else {
      onMenuChange(item.id);
    }
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.id === activeMenu) return true;
    if (item.children) {
      return item.children.some(child => child.id === activeMenu);
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {desaLogo ? (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white border border-gray-200">
              <img 
                src={desaLogo} 
                alt={`Logo ${desaName || 'Desa'}`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-6 h-6">
                <path d="M50 15 L85 45 L85 85 L15 85 L15 45 Z" fill="none" stroke="white" strokeWidth="3" />
              </svg>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="font-bold text-gray-900 whitespace-nowrap">AKSIDESA</h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">{desaName || 'Dashboard'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuActive(item);
          const hasChildren = !!item.children;
          const isExpanded = expandedMenus.includes(item.id);
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive && !hasChildren
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : isActive && hasChildren
                    ? 'text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-emerald-600')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 flex items-center justify-between overflow-hidden"
                    >
                      <span className="whitespace-nowrap text-sm">{item.label}</span>
                      {hasChildren && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Submenu */}
              <AnimatePresence>
                {hasChildren && isExpanded && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-1 space-y-1 overflow-hidden"
                  >
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeMenu === child.id;
                      
                      return (
                        <button
                          key={child.id}
                          onClick={() => onMenuChange(child.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                            isChildActive
                              ? 'bg-emerald-50 text-emerald-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <ChildIcon className={cn('w-4 h-4 flex-shrink-0', isChildActive && 'text-emerald-600')} />
                          <span className="whitespace-nowrap text-sm">{child.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed submenu - show as tooltip/popover */}
              {hasChildren && collapsed && (
                <div className="relative group">
                  {/* Invisible trigger for hover */}
                  <div className="absolute left-0 top-0 w-full h-0" />
                  
                  {/* Popup submenu on hover when collapsed */}
                  <div className="absolute left-full top-0 ml-2 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px]">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = activeMenu === child.id;
                        
                        return (
                          <button
                            key={child.id}
                            onClick={() => onMenuChange(child.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2 transition-all duration-200',
                              isChildActive
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            <ChildIcon className={cn('w-4 h-4 flex-shrink-0', isChildActive && 'text-emerald-600')} />
                            <span className="whitespace-nowrap text-sm">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-gray-200">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600">
              {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="font-medium text-gray-900 truncate text-sm">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{userRole.replace('_', ' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        )}
      </button>
    </aside>
  );
}
