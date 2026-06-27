/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Folder, Bill, Reminder, StorageInfo } from "../types";
import { 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Plus, 
  HardDrive,
  Sparkles,
  BellRing
} from "lucide-react";
import StorageCard from "./StorageCard";

interface DashboardViewProps {
  bills: Bill[];
  folders: Folder[];
  reminders: Reminder[];
  storage: StorageInfo;
  onNavigate: (tab: string) => void;
  onAddBillClick: () => void;
  onAddFolderClick: () => void;
}

export default function DashboardView({
  bills,
  folders,
  reminders,
  storage,
  onNavigate,
  onAddBillClick,
  onAddFolderClick,
}: DashboardViewProps) {
  // Compute analytics
  const unpaidBills = useMemo(() => bills.filter((b) => !b.isPaid), [bills]);
  
  const totalUnpaidAmount = useMemo(() => {
    return unpaidBills.reduce((acc, b) => acc + (b.amount || 0), 0);
  }, [unpaidBills]);

  const overdueBills = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return unpaidBills.filter((b) => b.dueDate < todayStr);
  }, [unpaidBills]);

  const upcomingBills = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return unpaidBills
      .filter((b) => b.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [unpaidBills]);

  // Compute pending reminders
  const activeReminders = useMemo(() => {
    return reminders.filter((r) => !r.sent);
  }, [reminders]);

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 tracking-tight">
            BillosDock Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back! Here's a brief breakdown of your offline bills and storage limits.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="dash_add_folder_btn"
            onClick={onAddFolderClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors border border-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
          <button
            id="dash_add_bill_btn"
            onClick={onAddBillClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Bill</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Unpaid */}
        <div id="metric_unpaid" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Unpaid Bills</span>
            <p className="text-2xl font-display font-bold text-slate-800 font-mono">
              {unpaidBills.length}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending manual/scanned upload verification</span>
            </p>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue */}
        <div id="metric_overdue" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Overdue Bills</span>
            <p className={`text-2xl font-display font-bold font-mono ${overdueBills.length > 0 ? "text-rose-600" : "text-slate-800"}`}>
              {overdueBills.length}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <AlertCircle className={`w-3.5 h-3.5 ${overdueBills.length > 0 ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
              <span>Requires immediate payment</span>
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${overdueBills.length > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Reminders */}
        <div id="metric_reminders" className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">Upcoming Alerts</span>
            <p className="text-2xl font-display font-bold text-slate-800 font-mono">
              {activeReminders.length}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5 text-brand-500" />
              <span>Reminders fully automated</span>
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Storage Limit, Quick Tools and Upcoming bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Storage Usage & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <StorageCard storage={storage} />

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
            <h3 className="font-display font-semibold text-sm text-slate-800 mb-3.5">
              Instant Document Tools
            </h3>
            <div className="space-y-2.5">
              <button
                id="quick_scan_btn"
                onClick={onAddBillClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50/30 group transition-all border border-slate-100 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-700">Scan Bill with AI</span>
                    <span className="block text-[10px] text-slate-400">Gemini OCR auto-fill</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate("folders")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50/30 group transition-all border border-slate-100 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-700">Offline Folders</span>
                    <span className="block text-[10px] text-slate-400">Organize and edit files</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col - Upcoming Bill Expirations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-slate-800 text-sm">
                  Upcoming Bill Expirations
                </h3>
                <p className="text-xs text-slate-400">Bills requiring payment sorted by due date</p>
              </div>
              <button
                onClick={() => onNavigate("folders")}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                View All Folders
              </button>
            </div>

            {upcomingBills.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">All caught up!</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  You don't have any outstanding unpaid bills. Upload a bill via camera scan or files to begin monitoring.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map((bill) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = bill.dueDate < todayStr;
                  
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg font-bold text-xs font-mono uppercase shrink-0 ${
                          isOverdue 
                            ? "bg-rose-50 text-rose-600" 
                            : bill.category === "Utilities" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
                        }`}>
                          {bill.category.substring(0, 3)}
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-[240px]">
                            {bill.name}
                          </span>
                          <span className="block text-xs text-slate-400 font-mono">
                            Due: {bill.dueDate} {isOverdue && <span className="text-rose-500 font-semibold">• OVERDUE</span>}
                          </span>
                          {/* Badges row: Category & Tags */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-100">
                              {bill.category}
                            </span>
                            {bill.tags && bill.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[9px] font-bold border border-brand-100/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onNavigate("folders")}
                          className="p-1 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Automated Reminders Alert Box */}
          <div className="bg-brand-50/40 border border-brand-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-brand-500 text-white rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="text-left space-y-1">
              <h4 className="text-xs font-bold text-brand-900 font-display">
                Automated Reminder Daemon Active
              </h4>
              <p className="text-xs text-slate-500 leading-normal">
                BillosDock runs offline checking. Once dates match, the system schedules active in-app triggers 1, 3, or 5 days prior to expiration. Enable push permissions inside your browser settings or inspect reminders to customize rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
