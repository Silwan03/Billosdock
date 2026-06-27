/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FolderOpen, 
  BellRing, 
  HardDrive, 
  Receipt,
  LogOut,
  Info,
  Menu,
  X
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  storagePercentage: number;
  userEmail: string | null;
  onLogout: () => void;
}

export default function Navigation({ activeTab, onTabChange, storagePercentage, userEmail, onLogout }: NavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "folders", label: "My Folders", icon: FolderOpen },
    { id: "reminders", label: "Reminders", icon: BellRing },
    { id: "storage", label: "Storage", icon: HardDrive },
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-600 border-r border-slate-200 h-screen sticky top-0 shrink-0 shadow-sm">
        {/* Branding header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-200/80">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand-100 shadow-lg">
            <Receipt className="w-5.5 h-5.5" />
          </div>
          <div className="text-left">
            <h1 className="font-display font-bold text-slate-900 text-lg tracking-tight leading-none">
              BillosDock
            </h1>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider font-semibold">
              OFFLINE BILL DOCK
            </span>
          </div>
        </div>

        {/* Primary Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 text-left">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                id={`nav_${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                  isActive 
                    ? "bg-brand-50 text-brand-700 font-semibold" 
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Disk Usage Indicator Footer */}
        <div className="p-5 border-t border-slate-200/60 bg-slate-50/50 text-left">
          {userEmail && (
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8.5 h-8.5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {userEmail}
                  </p>
                  <span className="text-[9px] text-slate-400 font-medium">Session Active</span>
                </div>
              </div>
              <button
                id="desktop_logout_btn"
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Log out from system"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Storage Used</span>
            <span className="font-bold text-brand-600 font-mono">{storagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/80">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                storagePercentage >= 100 ? "bg-rose-500" : storagePercentage >= 85 ? "bg-amber-500" : "bg-brand-500"
              }`}
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <div className="mt-4 text-center">
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold font-sans">
              Offline Mode Enabled
            </span>
          </div>
        </div>
      </aside>

      {/* Top Header for Mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Open side menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand-100 shadow-md">
              <Receipt className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <h1 className="font-display font-bold text-slate-900 text-sm tracking-tight leading-none">
                BillosDock
              </h1>
              <span className="text-[8px] text-slate-400 font-mono tracking-wider font-semibold">
                OFFLINE DOCK
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end text-right">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Storage</span>
            <span className="text-[10px] font-bold text-brand-600 font-mono leading-none">{storagePercentage.toFixed(0)}%</span>
          </div>
          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                storagePercentage >= 100 ? "bg-rose-500" : storagePercentage >= 85 ? "bg-amber-500" : "bg-brand-500"
              }`}
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer for Mobile */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 max-w-[80vw] bg-white text-slate-600 h-full shadow-2xl transition-transform duration-300 z-10 animate-slide-in-left text-left">
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand-100 shadow-md">
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <h1 className="font-display font-bold text-slate-900 text-sm tracking-tight leading-none">
                    BillosDock
                  </h1>
                  <span className="text-[8px] text-slate-400 font-mono tracking-wider font-semibold">
                    OFFLINE DOCK
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                      isActive 
                        ? "bg-brand-50 text-brand-700 font-semibold" 
                        : "hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer with storage usage */}
            <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
              {userEmail && (
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none">
                      {userEmail[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                        {userEmail}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">Session Active</span>
                    </div>
                  </div>
                  <button
                    id="mobile_drawer_logout_btn"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onLogout();
                    }}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-rose-500 transition-colors cursor-pointer shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span className="font-semibold uppercase tracking-wider text-[9px]">Storage Used</span>
                <span className="font-bold text-brand-600 font-mono">{storagePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    storagePercentage >= 100 ? "bg-rose-500" : storagePercentage >= 85 ? "bg-amber-500" : "bg-brand-500"
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-bold font-sans mt-3 text-center">
                Offline Mode Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile / Tablets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 text-slate-500 flex justify-around py-2.5 px-2 z-30 pb-safe shadow-lg">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1.5 py-1 px-4 rounded-xl transition-colors cursor-pointer min-w-[70px] min-h-[44px] justify-center ${
                isActive ? "text-brand-600 font-semibold bg-brand-50/50" : "hover:text-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
