/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Bill, StorageInfo } from "../types";
import { 
  HardDrive, 
  Trash2, 
  FileText, 
  AlertTriangle, 
  ArrowDownToLine, 
  Sparkles,
  RefreshCw,
  Clock,
  Database
} from "lucide-react";
import StorageCard from "./StorageCard";

interface StorageManagerViewProps {
  bills: Bill[];
  storage: StorageInfo;
  onDeleteBill: (id: string) => void;
  onClearAll: () => void;
}

export default function StorageManagerView({
  bills,
  storage,
  onDeleteBill,
  onClearAll,
}: StorageManagerViewProps) {
  // Sort bills by size descending
  const largestFiles = useMemo(() => {
    return [...bills]
      .filter((b) => b.fileSize > 0)
      .sort((a, b) => b.fileSize - a.fileSize);
  }, [bills]);

  const { usedBytes, limitBytes } = storage;
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(2);
  const limitMB = (limitBytes / (1024 * 1024)).toFixed(0);
  const freeMB = ((limitBytes - usedBytes) / (1024 * 1024)).toFixed(2);
  const filesCount = bills.filter((b) => b.fileData).length;

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="text-left space-y-1 mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-500" />
            <h1 className="text-xl font-display font-bold text-slate-800">Account Storage Management</h1>
          </div>
          <p className="text-xs text-slate-400">
            Monitor and clean up offline document data. IndexedDB stores attachments locally within your browser sandbox.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Progress bar and metrics */}
          <div className="md:col-span-2">
            <StorageCard storage={storage} />
          </div>

          {/* Quick specs */}
          <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl text-left space-y-2.5 font-mono text-xs text-slate-600">
            <span className="block text-xs font-bold text-slate-500 font-sans uppercase tracking-wider mb-1">Quota Details</span>
            <div className="flex justify-between">
              <span>Attached Files:</span>
              <strong className="text-slate-800">{filesCount} items</strong>
            </div>
            <div className="flex justify-between">
              <span>Available Space:</span>
              <strong className="text-emerald-600">{freeMB} MB</strong>
            </div>
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <strong className="text-slate-800">HTML5 IndexedDB</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing files manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Large files browser list */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h3 className="font-display font-semibold text-slate-800 text-sm">Offline Attachments Directory</h3>
                <p className="text-xs text-slate-400">Scanned bill attachments ordered by disk size</p>
              </div>
              
              {bills.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("CRITICAL WARNING: This will permanently delete ALL folders, bill scans, and reminders from IndexedDB. This cannot be undone. Clear everything?")) {
                      onClearAll();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs rounded-xl transition-colors border border-rose-100"
                >
                  Factory Reset DB
                </button>
              )}
            </div>

            {largestFiles.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/25">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-600">No attachments found</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Once you take camera scans or upload files, they will index here indicating their exact offline storage size.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {largestFiles.map((file) => {
                  const fileSizeKB = (file.fileSize / 1024).toFixed(1);
                  const isImage = file.fileType?.startsWith("image/");
                  
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left min-w-0">
                        {isImage ? (
                          <img
                            src={file.fileData}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-white"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                            DOC
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-700 truncate max-w-[180px] sm:max-w-[280px]">
                            {file.name}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Type: {file.fileType.split("/")[1]?.toUpperCase() || "UNKNOWN"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                        <span className="font-semibold text-slate-600">{fileSizeKB} KB</span>
                        <button
                          id={`del_storage_item_${file.id}`}
                          onClick={() => {
                            if (confirm(`Delete bill "${file.name}" to free up ${fileSizeKB} KB?`)) {
                              onDeleteBill(file.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete document attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Storage Policy info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs text-left space-y-3">
            <h3 className="font-display font-semibold text-slate-800 text-sm">Storage Safeguards</h3>
            
            <div className="space-y-3.5 text-xs text-slate-500 leading-relaxed">
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Quota Limits:</strong> Standard browser limits let apps request IndexedDB storage space. BillosDock restricts offline space to **100MB** to maintain high execution speeds and protect system storage.
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <RefreshCw className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Database Syncing:</strong> Since all documents remain 100% offline, clearing your browser cookies/site data will delete these documents. Export your files regularly to keep durable watermarked backups.
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <ArrowDownToLine className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Watermark Compression:</strong> When you scan camera snapshots, they are optimized and compressed automatically to maintain the lowest physical footprint, leaving plenty of room inside your 100MB budget.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
