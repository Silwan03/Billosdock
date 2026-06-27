/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Database, HardDrive, AlertTriangle } from "lucide-react";
import { StorageInfo } from "../types";

interface StorageCardProps {
  storage: StorageInfo;
  className?: string;
}

export default function StorageCard({ storage, className = "" }: StorageCardProps) {
  const { usedBytes, limitBytes } = storage;
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const limitMB = (limitBytes / (1024 * 1024)).toFixed(0);
  const percentage = Math.min(100, (usedBytes / limitBytes) * 100);
  const percentageStr = percentage.toFixed(1);

  // Storage warning status
  const isHighUsage = percentage >= 85;
  const isExceeded = percentage >= 100;

  let progressColor = "bg-brand-500";
  if (isExceeded) {
    progressColor = "bg-rose-600";
  } else if (isHighUsage) {
    progressColor = "bg-amber-500";
  }

  return (
    <div 
      id="storage_card"
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Offline Storage</h3>
            <p className="text-xs text-slate-400 font-mono">100MB User Quota</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full font-mono ${
          isExceeded ? "bg-rose-50 text-rose-700" : isHighUsage ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
        }`}>
          {percentageStr}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
        <div 
          id="storage_progress_fill"
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>{usedMB} MB Used</span>
        <span>{limitMB} MB Total Limit</span>
      </div>

      {isHighUsage && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs leading-normal">
            {isExceeded ? (
              <p className="font-semibold text-rose-800">Storage limit exceeded! Please delete older bill attachments to free up space.</p>
            ) : (
              <p>Approaching your 100MB limit. Consider deleting unused documents.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
