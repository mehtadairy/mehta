"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Download, UploadCloud, Database, RefreshCw, Archive, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBackups() {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  // Tables to support exporting
  const tables = ["products", "categories", "customers", "orders", "order_items", "payments", "refunds"];

  const handleExportCSV = async (tableName: string) => {
    setIsExporting(true);
    const { data, error } = await supabase.from(tableName).select("*");
    
    if (data && !error) {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `mehta_${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Log backup
      await supabase.from('backup_logs').insert([{
        backup_type: `CSV Export: ${tableName}`,
        status: 'success',
        created_by: 'Super Admin' // Will pull from auth state
      }]);
    }
    setIsExporting(false);
  };

  const handleExportExcel = async (tableName: string) => {
    setIsExporting(true);
    const { data, error } = await supabase.from(tableName).select("*");
    
    if (data && !error) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      
      XLSX.writeFile(workbook, `mehta_${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);

      // Log backup
      await supabase.from('backup_logs').insert([{
        backup_type: `Excel Export: ${tableName}`,
        status: 'success',
        created_by: 'Super Admin'
      }]);
    }
    setIsExporting(false);
  };

  const handleLogicalBackup = async () => {
    setIsExporting(true);
    const backup: any = {};
    for (const t of tables) {
      const { data } = await supabase.from(t).select("*");
      backup[t] = data || [];
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mehta_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await supabase.from('backup_logs').insert([{
      backup_type: `Full Logical Backup (JSON)`,
      status: 'success',
      created_by: 'Super Admin'
    }]);

    setIsExporting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetTable: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (window.confirm(`Are you sure you want to restore ${targetTable} from ${file.name}? This uses UPSERT logic and will overwrite matching IDs.`)) {
      setIsRestoring(true);
      setRestoreMessage("Parsing file...");

      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          setRestoreMessage(`Restoring ${results.data.length} rows to ${targetTable}...`);
          
          // Upsert data
          const validData = results.data.filter((row: any) => Object.keys(row).length > 1 && row.id);
          
          if (validData.length === 0) {
            setRestoreMessage("Error: No valid rows with 'id' found.");
            setIsRestoring(false);
            return;
          }

          const { error } = await supabase.from(targetTable).upsert(validData);
          
          if (error) {
            console.error("Restore Error", error);
            setRestoreMessage(`Restore Failed: ${error.message}`);
          } else {
            setRestoreMessage(`Successfully restored ${validData.length} records!`);
            
            await supabase.from('backup_logs').insert([{
              backup_type: `Restore CSV: ${targetTable}`,
              status: 'success',
              created_by: 'Super Admin'
            }]);
          }
          setIsRestoring(false);
        },
        error: (error) => {
          console.error(error);
          setRestoreMessage("Failed to parse CSV.");
          setIsRestoring(false);
        }
      });
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-orange" />
          Backup & Restore System
        </h3>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isExporting}
          onClick={handleLogicalBackup}
          className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} 
          Download Full Logical Backup
        </motion.button>
      </div>

      <div className="bg-[#fbfbfb]/50 backdrop-blur-md border border-brand-beige/50 rounded-2xl p-6">
        <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-4">Export Table Data</h4>
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.03 } }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {tables.map(table => (
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 150, damping: 20 } }
              }}
              whileHover={{ y: -3 }}
              key={`export-${table}`} 
              className="bg-white/80 border border-brand-beige rounded-2xl p-5 flex flex-col gap-3 shadow-xs hover:shadow-md hover:border-brand-orange/30 transition-all duration-300 relative overflow-hidden group cursor-default"
            >
              {/* Mesh mesh backdrop */}
              <div className="absolute inset-0 bg-radial-gradient from-brand-orange/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground font-sans block mb-1">
                {table} Table
              </span>
              <div className="flex gap-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isExporting}
                  onClick={() => handleExportCSV(table)}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.8 bg-brand-cream text-brand-charcoal rounded-lg text-xs font-bold hover:bg-brand-orange/15 transition-colors cursor-pointer border border-brand-beige/50"
                >
                  <Download className="w-3.5 h-3.5 text-brand-orange" /> CSV
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isExporting}
                  onClick={() => handleExportExcel(table)}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-1.8 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-100"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-red-50/50 backdrop-blur-md border border-red-100 rounded-2xl p-6 mt-4 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <h4 className="font-serif text-sm font-bold text-red-800 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-red-700" /> Restore System (Danger Zone)
          </h4>
          {restoreMessage && (
            <span className="text-xs font-bold text-red-600 bg-red-100/60 border border-red-200 rounded px-2.5 py-0.5">
              {restoreMessage}
            </span>
          )}
        </div>
        <p className="text-xs text-red-700 mb-6">
          Uploading a CSV will UPSERT data into the database. Existing records with matching IDs will be overwritten. Make sure your headers match the schema.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['products', 'categories', 'customers', 'orders'].map(table => (
            <motion.div 
              whileHover={{ scale: 1.01 }}
              key={`restore-${table}`} 
              className="border border-red-200/60 bg-white/90 rounded-2xl p-5 flex flex-col gap-3 shadow-2xs"
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-red-800 font-sans block mb-1">
                {table} Table
              </span>
              <motion.label 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors cursor-pointer text-center shadow-2xs border border-red-200"
              >
                <UploadCloud className="w-4 h-4 text-red-700" />
                Upload CSV
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  disabled={isRestoring}
                  onChange={(e) => handleFileUpload(e, table)}
                />
              </motion.label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating Synchronization Toast Portal */}
      <AnimatePresence>
        {(isRestoring || isExporting) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-white/90 backdrop-blur-md border border-brand-beige rounded-2xl shadow-xl p-5 flex items-center gap-4 max-w-sm select-none"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-brand-orange/20"
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-brand-orange border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-brand-charcoal uppercase tracking-wider font-sans">
                {isRestoring ? "Database Sync Active" : "Compiling Exports"}
              </span>
              <span className="text-[0.68rem] text-muted-foreground mt-0.5 font-medium leading-tight">
                {isRestoring ? restoreMessage || "Processing database writes..." : "Retrieving rows from remote tables..."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
