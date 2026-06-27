/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Folder, Bill } from "../types";
import { 
  FolderPlus, 
  Plus, 
  Folder as FolderIcon, 
  Trash2, 
  Edit2, 
  Check, 
  MoreVertical, 
  Share2, 
  Download, 
  FileText,
  Calendar,
  ExternalLink,
  Tag,
  Search,
  CheckSquare,
  Square,
  CheckCircle,
  FileCheck2,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { applyWatermark, shareViaWhatsApp } from "../lib/watermark";

interface FoldersViewProps {
  folders: Folder[];
  bills: Bill[];
  onAddFolder: (name: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onAddBillClick: (folderId: string) => void;
  onEditBill: (bill: Bill) => void;
  onSaveBillChange: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
}

const getCategoryBadgeClass = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("utility")) return "bg-blue-50 text-blue-700 border-blue-100";
  if (cat.includes("rent")) return "bg-indigo-50 text-indigo-700 border-indigo-100";
  if (cat.includes("grocery") || cat.includes("groc")) return "bg-amber-50 text-amber-700 border-amber-100";
  if (cat.includes("entertainment") || cat.includes("fun")) return "bg-purple-50 text-purple-700 border-purple-100";
  if (cat.includes("subscription")) return "bg-pink-50 text-pink-700 border-pink-100";
  if (cat.includes("credit") || cat.includes("debt")) return "bg-rose-50 text-rose-700 border-rose-100";
  if (cat.includes("insurance")) return "bg-teal-50 text-teal-700 border-teal-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
};

export default function FoldersView({
  folders,
  bills,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddBillClick,
  onEditBill,
  onSaveBillChange,
  onDeleteBill,
}: FoldersViewProps) {
  const [activeFolderId, setActiveFolderId] = useState<string>(folders[0]?.id || "");
  const [newFolderName, setNewFolderName] = useState("");
  
  // Mobile folders list open state
  const [isFoldersPanelOpen, setIsFoldersPanelOpen] = useState(false);
  
  // Folder editing states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Menu action triggers for individual bills
  const [openMenuBillId, setOpenMenuBillId] = useState<string | null>(null);
  const [watermarkLoading, setWatermarkLoading] = useState<string | null>(null);

  // Bill renaming inline state
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editingBillName, setEditingBillName] = useState("");

  // Active folder object
  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === activeFolderId) || folders[0];
  }, [folders, activeFolderId]);

  // Handle active folder update if folders list changes
  React.useEffect(() => {
    if (folders.length > 0 && !activeFolderId) {
      setActiveFolderId(folders[0].id);
    }
  }, [folders, activeFolderId]);

  // Filter bills in active folder by search term
  const filteredBills = useMemo(() => {
    if (!activeFolder) return [];
    return bills
      .filter((b) => b.folderId === activeFolder.id)
      .filter((b) => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
      );
  }, [bills, activeFolder, searchTerm]);

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim());
    setNewFolderName("");
  }

  function startRenameFolder(folder: Folder) {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  }

  function saveRenameFolder() {
    if (editingFolderId && editingFolderName.trim()) {
      onRenameFolder(editingFolderId, editingFolderName.trim());
      setEditingFolderId(null);
    }
  }

  // Handle Watermarked File Download
  async function handleDownloadWatermarked(bill: Bill) {
    if (!bill.fileData) {
      alert("No image document attached to download.");
      return;
    }
    setWatermarkLoading(bill.id);
    try {
      const watermarked = await applyWatermark(bill.fileData, "billosdock");
      
      // Trigger browser download
      const link = document.createElement("a");
      link.href = watermarked;
      link.download = `${bill.name.toLowerCase().replace(/\s+/g, "_")}_billosdock.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Watermark generation error:", err);
      alert("Failed to overlay watermark on download file.");
    } finally {
      setWatermarkLoading(null);
      setOpenMenuBillId(null);
    }
  }

  // Handle WhatsApp Share with watermark
  async function handleShareWhatsApp(bill: Bill) {
    if (!bill.fileData) {
      alert("No document file attached to share.");
      return;
    }
    setWatermarkLoading(bill.id);
    try {
      const watermarked = await applyWatermark(bill.fileData, "billosdock");
      shareViaWhatsApp(bill.name, watermarked);
    } catch (err) {
      console.error("WhatsApp Share watermark error:", err);
      alert("Failed to process secured watermark before sharing.");
    } finally {
      setWatermarkLoading(null);
      setOpenMenuBillId(null);
    }
  }

  // Inline rename document
  function startRenameBill(bill: Bill) {
    setEditingBillId(bill.id);
    setEditingBillName(bill.name);
    setOpenMenuBillId(null);
  }

  function saveRenameBill(bill: Bill) {
    if (editingBillName.trim() && editingBillId) {
      onSaveBillChange({
        ...bill,
        name: editingBillName.trim()
      });
      setEditingBillId(null);
    }
  }

  // Move document to other folder (Organize documents)
  function handleMoveFolder(bill: Bill, targetFolderId: string) {
    onSaveBillChange({
      ...bill,
      folderId: targetFolderId
    });
    setOpenMenuBillId(null);
  }

  // Toggle bill Paid / Unpaid status
  function handleTogglePaid(bill: Bill) {
    onSaveBillChange({
      ...bill,
      isPaid: !bill.isPaid
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
      {/* Sidebar - Folders Selector Panel */}
      <div className="md:col-span-1 space-y-4">
        {/* Mobile Header Card to expand/collapse folders directory */}
        <div className="md:hidden bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <button
            type="button"
            onClick={() => setIsFoldersPanelOpen(!isFoldersPanelOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-hidden cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FolderIcon className="w-5 h-5 text-brand-500" />
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                  Active Drawer Folder
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {activeFolder?.name || "No Folder Selected"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl">
                {isFoldersPanelOpen ? "Close Folders" : `View Directories (${folders.length})`}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFoldersPanelOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
        </div>

        {/* Folders List/Form, collapsible on mobile */}
        <div className={`${isFoldersPanelOpen ? "block" : "hidden md:block"} space-y-4`}>
          {/* Create Folder Form */}
          <form onSubmit={handleCreateFolder} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">
              New Offline Folder
            </label>
            <div className="flex gap-2">
              <input
                id="new_folder_input"
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Rent, Subscriptions..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              <button
                id="create_folder_btn"
                type="submit"
                className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors shadow-xs"
                title="Create Folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Folders List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Folders Directory
            </span>
            {folders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No folders created yet.</p>
            ) : (
              folders.map((folder) => {
                const isActive = activeFolder?.id === folder.id;
                const isEditing = editingFolderId === folder.id;
                
                // Count bills in folder
                const billCount = bills.filter((b) => b.folderId === folder.id).length;

                return (
                  <div
                    key={folder.id}
                    className={`group flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      isActive ? "bg-brand-50 text-brand-900 border border-brand-100" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && saveRenameFolder()}
                        />
                        <button onClick={saveRenameFolder} className="p-1 bg-emerald-500 text-white rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          // Auto collapse folder list on mobile selection for convenience
                          setIsFoldersPanelOpen(false);
                        }}
                        className="flex items-center gap-2 flex-1 text-left font-medium text-sm"
                      >
                        <FolderIcon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                        <span className="truncate max-w-[100px]">{folder.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100/60 font-semibold">
                          {billCount}
                        </span>
                      </button>
                    )}

                    {!isEditing && (
                      <div className="flex md:opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                        <button
                          onClick={() => startRenameFolder(folder)}
                          className="p-1 hover:text-brand-600 rounded-md hover:bg-slate-100/60"
                          title="Rename folder"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete folder "${folder.name}" and all of its bills? This action is offline-irreversible.`)) {
                              onDeleteFolder(folder.id);
                            }
                          }}
                          className="p-1 hover:text-rose-600 rounded-md hover:bg-slate-100/60"
                          title="Delete folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Files View Panel */}
      <div className="md:col-span-3 space-y-4">
        {activeFolder ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs min-h-[400px]">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <FolderIcon className="w-5 h-5 text-brand-500" />
                  <h2 className="font-display font-bold text-slate-800 text-base">
                    {activeFolder.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-400">Offline document drawer folder items</p>
              </div>

              <div className="flex gap-2.5 items-center">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search folder..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-brand-500 w-full sm:w-44"
                  />
                </div>

                <button
                  id="add_bill_folder_btn"
                  onClick={() => onAddBillClick(activeFolder.id)}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Document</span>
                </button>
              </div>
            </div>

            {/* List of Bill Items */}
            {filteredBills.length === 0 ? (
              <div className="py-20 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-600">No documents in this folder</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Upload a bill via camera or select standard files to store offline and set alert reminders.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBills.map((bill) => {
                  const isMenuOpen = openMenuBillId === bill.id;
                  const isBillEditing = editingBillId === bill.id;
                  const isLoadingWatermark = watermarkLoading === bill.id;

                  return (
                    <div
                      key={bill.id}
                      className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-2xl transition-all ${
                        bill.isPaid 
                          ? "bg-emerald-50/10 border-slate-100 hover:bg-emerald-50/20" 
                          : "bg-white border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Left: Checkbox + Name + Details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Paid Toggle Checkbox */}
                        <button
                          id={`pay_toggle_${bill.id}`}
                          onClick={() => handleTogglePaid(bill)}
                          className="mt-1 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-brand-500 transition-colors shrink-0"
                          title={bill.isPaid ? "Mark as unpaid" : "Mark as paid"}
                        >
                          {bill.isPaid ? (
                            <CheckSquare className="w-5 h-5 text-brand-500 fill-brand-50" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="text-left space-y-1 min-w-0 flex-1">
                          {isBillEditing ? (
                            <div className="flex items-center gap-1 max-w-xs">
                              <input
                                type="text"
                                value={editingBillName}
                                onChange={(e) => setEditingBillName(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && saveRenameBill(bill)}
                              />
                              <button onClick={() => saveRenameBill(bill)} className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold text-sm truncate ${bill.isPaid ? "text-slate-500 line-through" : "text-slate-800"}`}>
                                {bill.name}
                              </h4>
                              {bill.isPaid && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  PAID
                                </span>
                              )}
                            </div>
                          )}

                          {/* Badges row: Category & Tags */}
                          <div className="flex flex-wrap gap-1.5 items-center my-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${getCategoryBadgeClass(bill.category)}`}>
                              {bill.category}
                            </span>
                            {bill.tags && bill.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-[9px] font-bold border border-brand-100/30"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                            {bill.merchant && (
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                <span className="max-w-[120px] truncate">{bill.merchant}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {bill.dueDate}</span>
                            </span>
                            {bill.fileSize > 0 && (
                              <span>• {(bill.fileSize / 1024).toFixed(1)} KB</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Doc details & Action menu */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 shrink-0 border-t border-slate-100/50 pt-2.5 sm:pt-0 sm:border-0">
                        {/* Direct action shortcuts & Meatball dropdown */}
                        <div className="flex items-center gap-1.5 relative">
                          {bill.fileData && (
                            <>
                              <button
                                id={`download_watermark_${bill.id}`}
                                onClick={() => handleDownloadWatermarked(bill)}
                                disabled={isLoadingWatermark}
                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-all"
                                title="Download image with billosdock Watermark"
                              >
                                {isLoadingWatermark ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                id={`share_wa_${bill.id}`}
                                onClick={() => handleShareWhatsApp(bill)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                title="Share via WhatsApp with watermark"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Options menu toggler */}
                          <button
                            onClick={() => setOpenMenuBillId(isMenuOpen ? null : bill.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 w-48 z-20 text-xs">
                              <button
                                onClick={() => startRenameBill(bill)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Rename Document</span>
                              </button>
                              <button
                                onClick={() => onEditBill(bill)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Modify Details</span>
                              </button>

                              {/* Organize/Move To folders dropdown list */}
                              {folders.length > 1 && (
                                <div className="border-t border-slate-100 py-1">
                                  <span className="block px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Move to folder
                                  </span>
                                  {folders
                                    .filter((f) => f.id !== bill.folderId)
                                    .map((f) => (
                                      <button
                                        key={f.id}
                                        onClick={() => handleMoveFolder(bill, f.id)}
                                        className="w-full text-left px-4 py-1.5 hover:bg-slate-50 text-[11px] text-slate-600 pl-6 truncate"
                                      >
                                        📁 {f.name}
                                      </button>
                                    ))}
                                </div>
                              )}

                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => {
                                  if (confirm(`Delete the bill document "${bill.name}" permanently from offline storage?`)) {
                                    onDeleteBill(bill.id);
                                    setOpenMenuBillId(null);
                                  }
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Document</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xs text-center">
            <FolderPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-600 text-sm">Create an organizing folder</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              You need to create at least one folder before uploading bill scans. Type a name in the left panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
