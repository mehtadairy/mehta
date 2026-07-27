# Mehta Dairy - Automatic Thermal Printing System Setup Guide (v2)

This document describes how to install, configure, and troubleshoot the standalone **Automatic Thermal Print Agent (Windows Service)** on the shop's Windows computer.

---

## 1. Prerequisites

1. **Node.js**: Install Node.js (version 18 or above) from [nodejs.org](https://nodejs.org/).
2. **Thermal Printers**: Ensure your thermal printers (Billing, Kitchen, Packing) are connected to the network. You must configure their static IP addresses. If using a USB printer, install standard Windows Generic Text drivers and share them, or use a USB-to-LAN adapter.

---

## 2. Print Agent Installation

The agent code is located in the `/print-agent` directory of the project.

1. Copy the `/print-agent` folder to a secure local folder on the shop computer (e.g., `C:\MehtaPrintAgent`).
2. Open **PowerShell** or **Command Prompt** as **Administrator** in that folder and run:
   ```cmd
   npm install
   ```

---

## 3. Configuration

Open `.env` inside the print agent directory and update the settings to match your network:

```env
SUPABASE_URL=supabaseproject url
SUPABASE_ANON_KEY=your_supabase_anon_key
API_URL=https://mehtadairy.com
API_KEY=your_64_char_secure_api_key
BRANCH_ID=Main Shop
PRINTER_BILLING=192.168.1.100
PRINTER_KITCHEN=192.168.1.101
PRINTER_PACKING=192.168.1.102
```

### Parameters:
- `API_URL`: The deployed URL of your Next.js website.
- `API_KEY`: Secure token matching the `PRINT_AGENT_API_KEY` defined in the website's `.env.local` file.
- `BRANCH_ID`: A label identifying which branch/shop is printing (e.g., `Main Shop`).
- `PRINTER_XXX`: The exact IP address on the local network for the respective ESC/POS printer.

---

## 4. Running as a Windows Service (Invisible Background Agent)

To ensure the Print Agent starts automatically whenever the Windows computer boots and runs invisibly:

1. Open **Command Prompt as Administrator**.
2. Navigate to your Print Agent folder:
   ```cmd
   cd C:\MehtaPrintAgent
   ```
3. Run the installation script:
   ```cmd
   npm run install-service
   ```
4. You will see a success message. The agent is now running completely in the background. It will automatically restart on computer reboot.

### To Uninstall the Service:
```cmd
npm run uninstall-service
```

---

## 5. Admin Panel Setup

1. Log in to the **Admin Panel** (`/admin`) and click on the **Thermal Printers** menu tab.
2. Observe the status bar: it should display **Online / Connected** with a green pulse and show the exact timestamp when the print agent last connected (Heartbeat happens every 60 seconds).
3. If the Agent is turned off or blocked by the firewall, it will display **Offline**.

---

## 6. Troubleshooting

### 1. Printer is Offline / Cable Unplugged
- The Agent will attempt to connect to the printer IP. If it fails, the job is marked as **Failed** in the Admin panel and will not block the queue.
- You can use the Admin Panel to monitor the Print History Logs for `error_message`.

### 2. Missing Database Tables
- Ensure you have run `add_print_columns.sql` in your Supabase SQL Editor. This migration creates the new `print_jobs` real-time queue table.

### 3. Connection Authorization Failed (Heartbeat)
- Check that the `API_KEY` in the local `.env` exactly matches the `PRINT_AGENT_API_KEY` defined in the website's `.env.local` file.
