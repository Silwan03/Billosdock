/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Upload, Camera, FileText, Sparkles, Loader2, Calendar, AlertCircle, Tag, Plus, RefreshCw } from "lucide-react";
import { Folder, Bill } from "../types";
import CameraUpload from "./CameraUpload";

interface BillFormModalProps {
  bill?: Bill | null; // If editing, pass the bill
  folders: Folder[];
  currentFolderId?: string;
  onSave: (billData: Partial<Bill>) => void;
  onClose: () => void;
}

export default function BillFormModal({
  bill,
  folders,
  currentFolderId,
  onSave,
  onClose,
}: BillFormModalProps) {
  const isEditing = !!bill;
  const [name, setName] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [folderId, setFolderId] = useState("");
  const [category, setCategory] = useState("Other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [notes, setNotes] = useState("");

  // Attachment state
  const [fileData, setFileData] = useState<string>("");
  const [fileType, setFileType] = useState("image/jpeg");
  const [fileSize, setFileSize] = useState(0);
  const [fileName, setFileName] = useState("");

  // UI state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize fields
  useEffect(() => {
    if (bill) {
      setName(bill.name);
      setMerchant(bill.merchant);
      setAmount(bill.amount);
      setDueDate(bill.dueDate);
      setFolderId(bill.folderId);
      setCategory(bill.category);
      setTags(bill.tags || []);
      setRemindersEnabled(bill.remindersEnabled);
      setReminderDaysBefore(bill.reminderDaysBefore);
      setNotes(bill.notes || "");
      setFileData(bill.fileData);
      setFileType(bill.fileType);
      setFileSize(bill.fileSize);
    } else {
      setFolderId(currentFolderId || (folders[0]?.id || ""));
      setTags([]);
      setTagInput("");
      setCategory("Other");
      // Set today's date as default due date
      const today = new Date().toISOString().split("T")[0];
      setDueDate(today);
    }
  }, [bill, folders, currentFolderId]);

  // Handle local file upload
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.type);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFileData(dataUrl);
      setAnalysisError(null);
    };
    reader.readAsDataURL(file);
  }

  // Handle Camera Capture
  function handleCameraCapture(dataUrl: string) {
    setFileData(dataUrl);
    setFileType("image/jpeg");
    // Approximate size in bytes
    setFileSize(Math.round(dataUrl.length * 0.75));
    setFileName("camera_capture.jpg");
    setIsCameraOpen(false);
    setAnalysisError(null);
  }

  // Auto-extract using server-side Gemini AI API
  async function handleGeminiExtract() {
    if (!fileData) {
      setAnalysisError("Please upload a bill image or use the camera first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/analyze-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData, fileType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze document.");
      }

      const data = await response.json();

      if (data.isBill === false) {
        setAnalysisError("The uploaded file doesn't seem to be a readable bill, receipt, or invoice. Please check the image or enter details manually.");
        if (data.notes) {
          setNotes(data.notes);
        }
        return;
      }

      // Populate form
      if (data.merchant) setMerchant(data.merchant);
      if (data.amount) setAmount(data.amount);
      if (data.dueDate) setDueDate(data.dueDate);
      if (data.category) setCategory(data.category);
      if (data.notes) setNotes(data.notes);
      if (data.reminderDaysBefore) setReminderDaysBefore(data.reminderDaysBefore);
      
      // Auto generate descriptive name if empty
      if (data.merchant) {
        setName(`${data.merchant} - ${new Date(data.dueDate || Date.now()).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}`);
      }

      setSuccessMsg("Gemini parsed bill successfully! Fields have been auto-filled.");
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Could not reach AI analysis server. Please fill manually.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }

  function handleToggleSuggestedTag(suggested: string) {
    if (tags.includes(suggested)) {
      setTags(tags.filter((t) => t !== suggested));
    } else {
      setTags([...tags, suggested]);
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return;
    if (!folderId) {
      alert("Please select or create an organizing folder first.");
      return;
    }

    onSave({
      id: bill?.id,
      folderId,
      name,
      merchant,
      amount,
      dueDate,
      fileData,
      fileType,
      fileSize,
      isPaid: bill ? bill.isPaid : false,
      category,
      tags,
      remindersEnabled,
      reminderDaysBefore,
      notes,
    });
  }

  if (isCameraOpen) {
    return <CameraUpload onCapture={handleCameraCapture} onClose={() => setIsCameraOpen(false)} />;
  }

  return (
    <div id="bill_modal" className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="font-display font-semibold text-slate-800 text-lg">
            {isEditing ? "Edit Document Details" : "Upload New Bill"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 pb-16 sm:pb-6">
          {/* Document attachment slot */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Document / Bill Attachment
            </label>
            
            {fileData ? (
              <div className="relative border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {fileType.startsWith("image/") ? (
                    <img 
                      src={fileData} 
                      alt="Bill Preview" 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      DOC
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700 max-w-[200px] truncate">
                      {fileName || "Captured Bill.jpg"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(fileSize / 1024).toFixed(1)} KB • {fileType.split("/")[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="scan_ai_btn"
                    type="button"
                    onClick={handleGeminiExtract}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-all shadow-xs"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Fill</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFileData("");
                      setFileName("");
                      setFileSize(0);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-brand-500 rounded-2xl p-4 bg-slate-50/50 hover:bg-brand-50/20 cursor-pointer transition-all text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Upload from Phone</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Files, PDFs, Gallery</span>
                    <input
                      id="phone_upload_input"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-brand-500 rounded-2xl p-4 bg-slate-50/50 hover:bg-brand-50/20 cursor-pointer transition-all text-center">
                    <Camera className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700">Capture from Camera</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Direct phone lens</span>
                    <input
                      id="phone_camera_input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  id="webcam_input_btn"
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-200 hover:border-brand-500 rounded-2xl p-3 bg-slate-50/50 hover:bg-brand-50/20 transition-all text-center cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700">PC / Laptop Browser Webcam Scan</span>
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="p-3 bg-brand-50 border border-brand-100 text-brand-900 rounded-xl text-xs animate-pulse">
                ⏳ Server running Gemini 3.5 OCR processing... Analysing lines and parsing bill properties.
              </div>
            )}

            {analysisError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <p>{analysisError}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium">
                ✅ {successMsg}
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Bill metadata form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">
                Document Name *
              </label>
              <input
                id="bill_name_input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Electricity June 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">
                Merchant / Payee
              </label>
              <input
                id="bill_merchant_input"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Pacific Power Corp"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Due Date
              </label>
              <input
                id="bill_date_input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">
                Target Folder *
              </label>
              <select
                id="bill_folder_select"
                required
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-brand-500"
              >
                <option value="" disabled>Select a folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500">
                General Category
              </label>
              <select
                id="bill_category_select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-hidden focus:border-brand-500"
              >
                <option value="Utilities">Utilities</option>
                <option value="Rent">Rent & Housing</option>
                <option value="Groceries">Groceries</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Credit Cards">Credit Cards & Debt</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other Category</option>
              </select>
            </div>
          </div>

          {/* Custom Tags Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Custom Tags
            </label>
            
            <div className="flex gap-2">
              <input
                id="bill_tag_input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="e.g., Tax2026, Urgent, Shared"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
              />
              <button
                id="add_tag_btn"
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* List of active tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg border border-brand-100"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="p-0.5 rounded-full hover:bg-brand-200 hover:text-brand-900 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags Quick-Toggle */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Suggested:</span>
              <div className="flex flex-wrap gap-1.5">
                {["Tax", "Urgent", "Personal", "Business", "Shared"].map((suggested) => {
                  const isSelected = tags.includes(suggested);
                  return (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleToggleSuggestedTag(suggested)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      +{suggested}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">
              Quick Notes / Description
            </label>
            <textarea
              id="bill_notes_input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Account ending 4920, summer pricing rate applied"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
            />
          </div>

          {/* Automated Payment Reminders configuration */}
          <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-brand-900">
                  Automated Payment Reminder
                </span>
                <span className="block text-xs text-brand-700">
                  Notify me prior to the bill's expiration date.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="reminder_toggle"
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>

            {remindersEnabled && (
              <div className="flex items-center gap-3 pt-2 border-t border-brand-100 text-xs">
                <span className="text-slate-600">Remind me</span>
                <select
                  id="reminder_days_select"
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(parseInt(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value={0}>On the due date</option>
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={5}>5 days before</option>
                  <option value={7}>7 days before</option>
                </select>
                <span className="text-slate-600">at 09:00 AM</span>
              </div>
            )}
          </div>

          {/* Submit and cancel actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="save_bill_btn"
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-xs transition-colors"
            >
              {isEditing ? "Save Changes" : "Save Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
