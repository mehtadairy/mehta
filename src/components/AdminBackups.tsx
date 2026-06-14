"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Download, UploadCloud, Database, RefreshCw, Archive, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

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
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-brand-beige pb-3">
        <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-orange" />
          Backup & Restore System
        </h3>
        <button 
          disabled={isExporting}
          onClick={handleLogicalBackup}
          className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} 
          Download Full Logical Backup
        </button>
      </div>

      <div className="bg-white border border-brand-beige rounded-2xl shadow-sm p-6">
        <h4 className="font-serif text-sm font-bold text-brand-charcoal mb-4">Export Table Data</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={`export-${table}`} className="border border-brand-beige rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{table}</span>
              <div className="flex gap-2">
                <button 
                  disabled={isExporting}
                  onClick={() => handleExportCSV(table)}
                  className="flex-1 flex justify-center items-center gap-1 px-3 py-1.5 bg-brand-cream text-brand-charcoal rounded-md text-xs font-medium hover:bg-brand-orange/10 transition-colors"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button 
                  disabled={isExporting}
                  onClick={() => handleExportExcel(table)}
                  className="flex-1 flex justify-center items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl shadow-sm p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-serif text-sm font-bold text-red-800">Restore System (Danger Zone)</h4>
          {restoreMessage && <span className="text-xs font-bold text-red-600">{restoreMessage}</span>}
        </div>
        <p className="text-xs text-red-700 mb-6">Uploading a CSV will UPSERT data into the database. Existing records with matching IDs will be overwritten.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['products', 'categories', 'customers', 'orders'].map(table => (
            <div key={`restore-${table}`} className="border border-red-200 bg-white rounded-xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800">Restore {table}</span>
              <label className="flex justify-center items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-md text-xs font-medium hover:bg-red-200 transition-colors cursor-pointer text-center">
                <UploadCloud className="w-4 h-4" />
                Upload CSV
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  disabled={isRestoring}
                  onChange={(e) => handleFileUpload(e, table)}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
