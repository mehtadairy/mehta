param (
    [string]$printerName,
    [string]$filePath,
    [string]$qrData
)

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Net;

public class PrintGdi {
    public static void PrintTextAndQR(string printerName, string text, string qrData) {
        PrintDocument pd = new PrintDocument();
        pd.PrinterSettings.PrinterName = printerName;
        pd.DocumentName = "MehtaReceipt_" + DateTime.Now.Ticks;
        
        Image qrImage = null;
        if (!string.IsNullOrEmpty(qrData)) {
            try {
                using (WebClient wc = new WebClient()) {
                    wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                    // Download a 120x120 QR Code
                    byte[] imageBytes = wc.DownloadData("https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + Uri.EscapeDataString(qrData));
                    using (MemoryStream ms = new MemoryStream(imageBytes)) {
                        qrImage = Image.FromStream(ms);
                    }
                }
            } catch (Exception ex) {
                Console.WriteLine("Could not download QR: " + ex.Message);
            }
        }

        pd.PrintPage += (s, e) => {
            using (Font f = new Font("Courier New", 9.5f, FontStyle.Bold)) {
                // Remove the string "[ QR CODE GRAPHIC ]" from the text
                string cleanText = text.Replace("[ QR CODE GRAPHIC ]", "").TrimEnd();
                
                // Draw the text
                e.Graphics.DrawString(cleanText, f, Brushes.Black, new PointF(0, 0));
                
                // Draw QR Code at the bottom
                if (qrImage != null) {
                    SizeF textSize = e.Graphics.MeasureString(cleanText, f);
                    // Center the QR code (Assuming 80mm width is roughly 280-300 pixels at normal DPI)
                    float qrX = (280 - 120) / 2;
                    e.Graphics.DrawImage(qrImage, qrX, textSize.Height + 10, 120, 120);
                }
            }
        };
        pd.Print();
    }
}
"@

$text = [System.IO.File]::ReadAllText($filePath)
[PrintGdi]::PrintTextAndQR($printerName, $text, $qrData)
