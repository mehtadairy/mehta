using System;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;

class Program {
    static string textToPrint;
    
    static void Main(string[] args) {
        if (args.Length < 2) {
            Console.WriteLine("Usage: print_gdi.exe <PrinterName> <FilePath>");
            return;
        }

        string printerName = args[0];
        string filePath = args[1];

        try {
            textToPrint = File.ReadAllText(filePath);
            
            PrintDocument pd = new PrintDocument();
            pd.PrinterSettings.PrinterName = printerName;
            
            pd.PrintPage += new PrintPageEventHandler(PrintPage);
            pd.Print();
            
            Console.WriteLine("Successfully sent GDI print job to " + printerName);
        } catch (Exception ex) {
            Console.WriteLine("Error: " + ex.Message);
            Environment.Exit(1);
        }
    }

    static void PrintPage(object sender, PrintPageEventArgs e) {
        // Use a strictly monospaced font so all columns align perfectly like the preview
        using (Font font = new Font("Courier New", 9.5f)) {
            // Remove margins to maximize printable area on the 80mm roll
            e.Graphics.DrawString(textToPrint, font, Brushes.Black, new PointF(0, 0));
        }
    }
}
