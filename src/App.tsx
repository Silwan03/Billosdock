/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  getFolders, 
  saveFolder, 
  deleteFolder, 
  getBills, 
  saveBill, 
  deleteBill, 
  getReminders, 
  saveReminder, 
  deleteReminder, 
  getStorageInfo 
} from "./lib/db";
import { Folder, Bill, Reminder, StorageInfo } from "./types";
import Navigation from "./components/Navigation";
import DashboardView from "./components/DashboardView";
import FoldersView from "./components/FoldersView";
import RemindersView from "./components/RemindersView";
import StorageManagerView from "./components/StorageManagerView";
import BillFormModal from "./components/BillFormModal";
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  FolderPlus, 
  Plus,
  Receipt,
  FileCheck2,
  BellRing
} from "lucide-react";

// Standard base64 blank document template for seed data (light gray receipt placeholder)
const SEED_RECEIPT_BASE64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='100%' height='100%' fill='%23f1f5f9'/><line x1='30' y1='50' x2='370' y2='50' stroke='%23cbd5e1' stroke-width='4'/><text x='50' y='100' font-family='monospace' font-size='24' font-weight='bold' fill='%231e293b'>INVOICE BILL</text><text x='50' y='140' font-family='monospace' font-size='14' fill='%2364748b'>Merchant: Electricity Corp</text><text x='50' y='165' font-family='monospace' font-size='14' fill='%2364748b'>Account Ref: #29402-293</text><line x1='30' y1='200' x2='370' y2='200' stroke='%23e2e8f0' stroke-width='2' stroke-dasharray='5,5'/><text x='50' y='250' font-family='monospace' font-size='14' fill='%23334155'>Standard Energy Charge: $95.00</text><text x='50' y='280' font-family='monospace' font-size='14' fill='%23334155'>Local Network Fees:    $25.45</text><line x1='30' y1='340' x2='370' y2='340' stroke='%23e2e8f0' stroke-width='2'/><text x='50' y='390' font-family='monospace' font-size='18' font-weight='bold' fill='%231e293b'>Total Due: $120.45</text><text x='50' y='420' font-family='monospace' font-size='12' fill='%23ef4444'>PAYMENT EXPIRED SOON</text><rect x='30' y='460' width='340' height='100' fill='%23e2e8f0' rx='10'/><text x='200' y='515' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2394a3b8' text-anchor='middle'>billosdock secured</text></svg>";

const SEED_RENT_BASE64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='100%' height='100%' fill='%23f0fdf4'/><line x1='30' y1='50' x2='370' y2='50' stroke='%2386efac' stroke-width='4'/><text x='50' y='100' font-family='monospace' font-size='24' font-weight='bold' fill='%23166534'>RENTAL AGREEMENT</text><text x='50' y='140' font-family='monospace' font-size='14' fill='%2315803d'>Landlord: Elite Living Ltd</text><text x='50' y='165' font-family='monospace' font-size='14' fill='%2315803d'>Property: Suite 305B</text><line x1='30' y1='200' x2='370' y2='200' stroke='%23bbf7d0' stroke-width='2' stroke-dasharray='5,5'/><text x='50' y='250' font-family='monospace' font-size='14' fill='%23166534'>Monthly Rent Cost: $1,200.00</text><line x1='30' y1='340' x2='370' y2='340' stroke='%2386efac' stroke-width='2'/><text x='50' y='390' font-family='monospace' font-size='18' font-weight='bold' fill='%2314532d'>Total Paid: $1,200.00</text><text x='50' y='420' font-family='monospace' font-size='12' fill='%2316a34a'>TRANSACTION RECORD SECURED</text><rect x='30' y='460' width='340' height='100' fill='%23dcfce7' rx='10'/><text x='200' y='515' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2386efac' text-anchor='middle'>billosdock secured</text></svg>";

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem("billosdock_user") || "silwancody@gmail.com";
  });
  const [loginEmail, setLoginEmail] = useState("silwancody@gmail.com");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [storage, setStorage] = useState<StorageInfo>({ usedBytes: 0, limitBytes: 100 * 1024 * 1024 });

  // Handle simple login
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    setCurrentUser(loginEmail.trim());
    localStorage.setItem("billosdock_user", loginEmail.trim());
  }

  // Handle simple logout
  function handleLogout() {
    if (confirm("Are you sure you want to sign out of your offline BillosDock session? Your local bills and directory structure will remain secured in your browser context.")) {
      setCurrentUser(null);
      localStorage.removeItem("billosdock_user");
    }
  }

  // Modals / forms toggle state
  const [isBillFormOpen, setIsBillFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [defaultFolderId, setDefaultFolderId] = useState<string | undefined>(undefined);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Simulated Alert Notification
  const [activeAlert, setActiveAlert] = useState<{
    billName: string;
    amount: number;
    dueDate: string;
    daysBefore: number;
    soundEnabled: boolean;
  } | null>(null);

  // Load database content on startup
  async function loadData() {
    try {
      let loadedFolders = await getFolders();
      let loadedBills = await getBills();
      let loadedReminders = await getReminders();

      // Seed standard folders if empty for visual beauty
      if (loadedFolders.length === 0) {
        const seedFolders: Folder[] = [
          { id: "fold-util", name: "Utilities", createdAt: Date.now() },
          { id: "fold-housing", name: "Rent & Housing", createdAt: Date.now() + 10 },
          { id: "fold-subs", name: "Subscriptions", createdAt: Date.now() + 20 }
        ];

        for (const f of seedFolders) {
          await saveFolder(f);
        }
        loadedFolders = seedFolders;

        // Also seed placeholder bills so the user has fully interactive files immediately
        const today = new Date();
        const inFiveDays = new Date();
        inFiveDays.setDate(today.getDate() + 5);
        const inFiveDaysStr = inFiveDays.toISOString().split("T")[0];

        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split("T")[0];

        const seedBills: Bill[] = [
          {
            id: "bill-elec",
            folderId: "fold-util",
            name: "Electricity Bill June",
            merchant: "Pacific Power",
            amount: 120.45,
            dueDate: inFiveDaysStr,
            fileData: "data:image/svg+xml;base64," + btoa(SEED_RECEIPT_BASE64),
            fileType: "image/svg+xml",
            fileSize: SEED_RECEIPT_BASE64.length,
            isPaid: false,
            category: "Utilities",
            remindersEnabled: true,
            reminderDaysBefore: 3,
            createdAt: Date.now()
          },
          {
            id: "bill-rent",
            folderId: "fold-housing",
            name: "Apartment Rent Receipt",
            merchant: "Elite Living Ltd",
            amount: 1200.00,
            dueDate: lastWeekStr,
            fileData: "data:image/svg+xml;base64," + btoa(SEED_RENT_BASE64),
            fileType: "image/svg+xml",
            fileSize: SEED_RENT_BASE64.length,
            isPaid: true,
            category: "Rent",
            remindersEnabled: false,
            reminderDaysBefore: 0,
            createdAt: Date.now() + 10
          }
        ];

        for (const b of seedBills) {
          await saveBill(b);
          // Auto generate reminder if needed
          if (b.remindersEnabled) {
            const trigger = new Date(b.dueDate);
            trigger.setDate(trigger.getDate() - b.reminderDaysBefore);
            const triggerStr = trigger.toISOString().split("T")[0];

            await saveReminder({
              id: `rem-${b.id}`,
              billId: b.id,
              billName: b.name,
              amount: b.amount,
              dueDate: b.dueDate,
              triggerDate: triggerStr,
              sent: false,
              daysBefore: b.reminderDaysBefore
            });
          }
        }

        loadedBills = seedBills;
        loadedReminders = await getReminders();
      }

      setFolders(loadedFolders);
      setBills(loadedBills);
      setReminders(loadedReminders);

      // Re-calculate storage quota usage
      const storageInfo = await getStorageInfo();
      setStorage(storageInfo);
    } catch (err) {
      console.error("Database seed error:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Folder actions
  async function handleAddFolder(name: string) {
    const newFolder: Folder = {
      id: `fold-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    await saveFolder(newFolder);
    await loadData();
  }

  async function handleRenameFolder(id: string, newName: string) {
    const folder = folders.find((f) => f.id === id);
    if (folder) {
      await saveFolder({ ...folder, name: newName });
      await loadData();
    }
  }

  async function handleDeleteFolder(id: string) {
    await deleteFolder(id);
    await loadData();
  }

  // Bill CRUD actions
  async function handleSaveBill(billData: Partial<Bill>) {
    // Determine ID
    const billId = billData.id || `bill-${Date.now()}`;
    const fullBill: Bill = {
      id: billId,
      folderId: billData.folderId || "",
      name: billData.name || "Unnamed Document",
      merchant: billData.merchant || "",
      amount: billData.amount || 0,
      dueDate: billData.dueDate || new Date().toISOString().split("T")[0],
      fileData: billData.fileData || "",
      fileType: billData.fileType || "image/jpeg",
      fileSize: billData.fileSize || 0,
      isPaid: billData.isPaid || false,
      category: billData.category || "Other",
      tags: billData.tags || [],
      remindersEnabled: billData.remindersEnabled !== undefined ? billData.remindersEnabled : true,
      reminderDaysBefore: billData.reminderDaysBefore !== undefined ? billData.reminderDaysBefore : 3,
      createdAt: billData.createdAt || Date.now(),
      notes: billData.notes || "",
    };

    // Store in DB
    await saveBill(fullBill);

    // Update corresponding Reminder alert row
    if (fullBill.remindersEnabled && !fullBill.isPaid) {
      const trigger = new Date(fullBill.dueDate);
      trigger.setDate(trigger.getDate() - fullBill.reminderDaysBefore);
      const triggerStr = trigger.toISOString().split("T")[0];

      await saveReminder({
        id: `rem-${fullBill.id}`,
        billId: fullBill.id,
        billName: fullBill.name,
        amount: fullBill.amount,
        dueDate: fullBill.dueDate,
        triggerDate: triggerStr,
        sent: false,
        daysBefore: fullBill.reminderDaysBefore
      });
    } else {
      // If reminders are disabled or bill marked paid, delete corresponding reminder record
      await deleteReminder(`rem-${fullBill.id}`);
    }

    setIsBillFormOpen(false);
    setEditingBill(null);
    await loadData();
  }

  async function handleDeleteBill(id: string) {
    await deleteBill(id);
    await loadData();
  }

  // Update specific bill properties (like toggles)
  async function handleSaveBillChange(updatedBill: Bill) {
    await saveBill(updatedBill);
    
    // Manage reminders
    if (updatedBill.remindersEnabled && !updatedBill.isPaid) {
      const trigger = new Date(updatedBill.dueDate);
      trigger.setDate(trigger.getDate() - updatedBill.reminderDaysBefore);
      const triggerStr = trigger.toISOString().split("T")[0];

      await saveReminder({
        id: `rem-${updatedBill.id}`,
        billId: updatedBill.id,
        billName: updatedBill.name,
        amount: updatedBill.amount,
        dueDate: updatedBill.dueDate,
        triggerDate: triggerStr,
        sent: false,
        daysBefore: updatedBill.reminderDaysBefore
      });
    } else {
      await deleteReminder(`rem-${updatedBill.id}`);
    }

    await loadData();
  }

  // Inline configuration changes for reminders screen
  async function handleUpdateBillReminder(bill: Bill, enabled: boolean, daysBefore: number) {
    const updated = {
      ...bill,
      remindersEnabled: enabled,
      reminderDaysBefore: daysBefore
    };
    await handleSaveBillChange(updated);
  }

  // Clear everything (factory reset)
  async function handleFactoryReset() {
    // Delete folders & bills
    for (const f of folders) {
      await deleteFolder(f.id);
    }
    for (const b of bills) {
      await deleteBill(b.id);
    }
    // Set view back to dashboard
    setActiveTab("dashboard");
    await loadData();
  }

  // Navigation handlers
  function handleNavigate(tab: string) {
    setActiveTab(tab);
  }

  function triggerAddBill(folderId?: string) {
    setDefaultFolderId(folderId);
    setEditingBill(null);
    setIsBillFormOpen(true);
  }

  function triggerEditBill(bill: Bill) {
    setEditingBill(bill);
    setIsBillFormOpen(true);
  }

  function handleAddFolderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newFolderName.trim()) {
      handleAddFolder(newFolderName.trim());
      setNewFolderName("");
      setIsAddFolderOpen(false);
    }
  }

  // Trigger sound alarm & show visual alert notification modal
  function handleTestAlert(billName: string, amount: number, dueDate: string, daysBefore: number) {
    setActiveAlert({
      billName,
      amount,
      dueDate,
      daysBefore,
      soundEnabled: true,
    });

    // Try playing a gentle retro notification sound using browser synthesize web-audio
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0.15, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Play a beautiful "bell melody"
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.12, 0.15); // E5
      playTone(783.99, now + 0.24, 0.3); // G5
    } catch (e) {
      console.warn("Audio Context sound failed to play", e);
    }
  }

  // Calculate storage percentage
  const storagePercentage = Math.min(100, (storage.usedBytes / storage.limitBytes) * 100);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-brand-100 shadow-xl animate-pulse">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-2xl tracking-tight leading-none">
                BillosDock
              </h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold uppercase block mt-1">
                SECURE OFFLINE DOCK
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-800">Sign in to your session</h2>
            <p className="text-xs text-slate-400">
              Access your localized repository for offline storage, folder organization, and active alarms.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
              <input
                id="login_email_input"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500 font-sans"
              />
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-brand-100 shadow-md active:scale-98 cursor-pointer"
            >
              Access Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50/50 rounded-xl space-y-0.5">
              <span className="block text-slate-700 font-bold text-xs">100MB</span>
              <span className="block text-[8px] text-slate-400 uppercase font-mono font-bold">Quota</span>
            </div>
            <div className="p-2 bg-slate-50/50 rounded-xl space-y-0.5">
              <span className="block text-slate-700 font-bold text-xs">Offline</span>
              <span className="block text-[8px] text-slate-400 uppercase font-mono font-bold">Isolated</span>
            </div>
            <div className="p-2 bg-slate-50/50 rounded-xl space-y-0.5">
              <span className="block text-slate-700 font-bold text-xs">Remind</span>
              <span className="block text-[8px] text-slate-400 uppercase font-mono font-bold">Engines</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Dynamic Nav drawer / sidebar */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleNavigate} 
        storagePercentage={storagePercentage}
        userEmail={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Body content screen */}
      <main className="flex-1 px-4 py-6 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Active alerts warnings marquee if overdue items exist */}
          {bills.some(b => !b.isPaid && b.dueDate < new Date().toISOString().split("T")[0]) && (
            <div id="overdue_banner" className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center justify-between text-xs font-semibold animate-pulse">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Urgent: You have outstanding overdue bills that require immediate payment!</span>
              </span>
              <button
                onClick={() => handleNavigate("folders")}
                className="underline hover:no-underline font-bold tracking-tight text-rose-900 shrink-0"
              >
                Inspect Files
              </button>
            </div>
          )}

          {/* Render Active View tab */}
          {activeTab === "dashboard" && (
            <DashboardView
              bills={bills}
              folders={folders}
              reminders={reminders}
              storage={storage}
              onNavigate={handleNavigate}
              onAddBillClick={() => triggerAddBill()}
              onAddFolderClick={() => setIsAddFolderOpen(true)}
            />
          )}

          {activeTab === "folders" && (
            <FoldersView
              folders={folders}
              bills={bills}
              onAddFolder={handleAddFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onAddBillClick={triggerAddBill}
              onEditBill={triggerEditBill}
              onSaveBillChange={handleSaveBillChange}
              onDeleteBill={handleDeleteBill}
            />
          )}

          {activeTab === "reminders" && (
            <RemindersView
              bills={bills}
              reminders={reminders}
              onTriggerTestNotification={handleTestAlert}
              onUpdateBillReminder={handleUpdateBillReminder}
            />
          )}

          {activeTab === "storage" && (
            <StorageManagerView
              bills={bills}
              storage={storage}
              onDeleteBill={handleDeleteBill}
              onClearAll={handleFactoryReset}
            />
          )}

        </div>
      </main>

      {/* Modal - Document Upload / Edit Form */}
      {isBillFormOpen && (
        <BillFormModal
          bill={editingBill}
          folders={folders}
          currentFolderId={defaultFolderId}
          onSave={handleSaveBill}
          onClose={() => {
            setIsBillFormOpen(false);
            setEditingBill(null);
          }}
        />
      )}

      {/* Modal - Create Folder Drawer from Dashboard */}
      {isAddFolderOpen && (
        <div id="add_folder_modal" className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-brand-500" />
                <h3 className="font-display font-semibold text-slate-800">New Offline Folder</h3>
              </div>
              <button onClick={() => setIsAddFolderOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddFolderSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-slate-500">Folder Name</label>
                <input
                  id="dash_folder_name_input"
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="E.g., Utilities, Subscriptions"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-brand-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddFolderOpen(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="dash_save_folder_btn"
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alarm Alert Simulation Modal */}
      {activeAlert && (
        <div id="alarm_modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-4 border-rose-500 text-center space-y-5 animate-bounce">
            
            {/* Alarm ring visual */}
            <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Bell className="w-8 h-8 animate-wiggle" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-rose-500 font-mono tracking-widest uppercase block">
                BILLOSDOCK AUTOMATED ALERT
              </span>
              <h3 className="font-display font-bold text-slate-800 text-lg">
                Payment Reminder Triggered!
              </h3>
              <p className="text-xs text-slate-400">
                The offline daemon caught an expiration date within your interval threshold!
              </p>
            </div>

            {/* Bill Info Card */}
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Document:</span>
                <strong className="text-slate-800 truncate max-w-[160px]">{activeAlert.billName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Expiry:</span>
                <strong className="text-rose-600 font-bold">{activeAlert.dueDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Trigger:</span>
                <strong className="text-slate-800">{activeAlert.daysBefore} days prior</strong>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    // Quick pay simulation
                    alert(`Simulated payment gateway opened for ${activeAlert.billName}. Invoice marked paid!`);
                    // Find and mark as paid
                    const matchedBill = bills.find(b => b.name === activeAlert.billName);
                    if (matchedBill) {
                      handleSaveBillChange({
                        ...matchedBill,
                        isPaid: true
                      });
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  setActiveAlert(null);
                }}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
              >
                Simulate Payment
              </button>
              <button
                onClick={() => setActiveAlert(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
