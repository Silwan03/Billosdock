/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Bill, Reminder } from "../types";
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  BellRing,
  HelpCircle,
  CalendarDays,
  XCircle,
  Sparkles
} from "lucide-react";

interface RemindersViewProps {
  bills: Bill[];
  reminders: Reminder[];
  onTriggerTestNotification: (billName: string, amount: number, dueDate: string, daysBefore: number) => void;
  onUpdateBillReminder: (bill: Bill, enabled: boolean, daysBefore: number) => void;
}

export default function RemindersView({
  bills,
  reminders,
  onTriggerTestNotification,
  onUpdateBillReminder,
}: RemindersViewProps) {
  const [daemonActive, setDaemonActive] = useState(true);

  // Group outstanding bills with reminders enabled
  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return bills
      .filter((b) => !b.isPaid && b.remindersEnabled)
      .map((b) => {
        // Calculate trigger date
        const due = new Date(b.dueDate);
        const trigger = new Date(due);
        trigger.setDate(due.getDate() - b.reminderDaysBefore);
        const triggerStr = trigger.toISOString().split("T")[0];
        
        return {
          bill: b,
          triggerDate: triggerStr,
          isTriggered: triggerStr <= todayStr
        };
      })
      .sort((a, b) => a.triggerDate.localeCompare(b.triggerDate));
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Header section with toggle daemon */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-brand-500" />
            <h1 className="text-xl font-display font-bold text-slate-800">Automated Payment Reminders</h1>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Configure custom intervals (1, 3, or 5 days before expiration) to guarantee you never miss a billing deadline.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <div className="text-left">
            <span className="block text-xs font-bold text-slate-700">Autopilot Engine</span>
            <span className={`block text-[10px] font-mono ${daemonActive ? "text-emerald-500 font-bold" : "text-slate-400"}`}>
              {daemonActive ? "● RUNNING ONLINE" : "○ STOPPED"}
            </span>
          </div>
          <button
            onClick={() => setDaemonActive(!daemonActive)}
            className="text-brand-500 hover:text-brand-600 transition-colors"
          >
            {daemonActive ? (
              <ToggleRight className="w-10 h-10 text-brand-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Grid: Alert schedule and direct configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Trigger alert scheduler lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
              Automated Alerts Timeline
            </h3>

            {upcomingReminders.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-slate-700">All Reminders Clear</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  You don't have any unpaid bills with reminders scheduled. Set up custom alerts when uploading or editing bills.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map(({ bill, triggerDate, isTriggered }) => {
                  return (
                    <div
                      key={bill.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl transition-all ${
                        isTriggered 
                          ? "bg-amber-50/30 border-amber-100" 
                          : "bg-white border-slate-100"
                      }`}
                    >
                      <div className="flex items-start gap-3 text-left">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isTriggered ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-500"
                        }`}>
                          <Bell className={`w-4 h-4 ${isTriggered && daemonActive ? "animate-bounce" : ""}`} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-semibold text-sm text-slate-800 truncate max-w-[200px] sm:max-w-[280px]">
                            {bill.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono">
                            <span>Due: {bill.dueDate}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-semibold ${
                            isTriggered 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>Remind on {triggerDate} ({bill.reminderDaysBefore} days prior)</span>
                          </span>
                        </div>
                      </div>

                      {/* Manual trigger for alert sandbox test */}
                      <div className="mt-3.5 sm:mt-0 flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          id={`test_alert_btn_${bill.id}`}
                          onClick={() => onTriggerTestNotification(
                            bill.name,
                            bill.amount,
                            bill.dueDate,
                            bill.reminderDaysBefore
                          )}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-all"
                          title="Trigger mock phone alert notification"
                        >
                          <Play className="w-3 h-3 text-brand-500 fill-brand-500" />
                          <span>Test Alert</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Config center */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Config lists */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-semibold text-slate-800 text-sm mb-3">
              Checklist Settings
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Quickly toggle reminders or change intervals for bills.
            </p>

            {bills.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                No bills stored offline.
              </p>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto no-scrollbar">
                {bills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-2.5 border border-slate-50 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="text-left min-w-0 max-w-[120px] sm:max-w-[140px]">
                      <span className="block text-xs font-semibold text-slate-700 truncate">{bill.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Due {bill.dueDate}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {bill.remindersEnabled && (
                        <select
                          id={`days_select_${bill.id}`}
                          value={bill.reminderDaysBefore}
                          onChange={(e) => onUpdateBillReminder(
                            bill,
                            bill.remindersEnabled,
                            parseInt(e.target.value)
                          )}
                          className="text-[10px] font-mono font-semibold px-1.5 py-0.5 border border-slate-200 rounded bg-white text-slate-600 focus:outline-hidden"
                        >
                          <option value={0}>0 days</option>
                          <option value={1}>1 day</option>
                          <option value={3}>3 days</option>
                          <option value={5}>5 days</option>
                          <option value={7}>7 days</option>
                        </select>
                      )}

                      <button
                        id={`rem_toggle_${bill.id}`}
                        onClick={() => onUpdateBillReminder(
                          bill,
                          !bill.remindersEnabled,
                          bill.reminderDaysBefore
                        )}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
                          bill.remindersEnabled ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {bill.remindersEnabled ? "ACTIVE" : "OFF"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sandbox Info */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 font-display">Testing Reminders</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Since we are running in an offline sandbox browser, real operating system cron push notifications aren't visible directly on mobile frames. To verify the automated reminder logic, use the **Test Alert** button. This fires an instant simulation of your bill reminder, letting you experience BillosDock's alarm alert interface!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
