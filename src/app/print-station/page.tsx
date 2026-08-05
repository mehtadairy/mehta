"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Printer, CheckCircle, AlertCircle, ClipboardList, CalendarDays, Clock, User, Phone, MapPin, Heart, Smartphone } from "lucide-react";
import { fetchPendingOrderAction, markOrderPrintedAction } from "./actions";

export default function PrintStation() {
  const [status, setStatus] = useState<"idle" | "printing" | "error">("idle");
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const isPrintingRef = useRef(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev,
    ].slice(0, 50));
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  const fetchPendingOrder = async () => {
    if (isPrintingRef.current) return;

    try {
      const data = await fetchPendingOrderAction();
      
      if (data.success && data.orders && data.orders.length > 0) {
        // We have an order to print
        const orderToPrint = data.orders[0];
        isPrintingRef.current = true;
        setCurrentOrder(orderToPrint);
        setStatus("printing");
        addLog(`Found new order: ${orderToPrint.orderNumber || orderToPrint.id}`);
        playBeep();

        // Give React a moment to render the receipt before calling print
        setTimeout(() => {
          window.print();
          
          // Assume printed after print dialog closes
          // Or we can just use a timeout since kiosk mode prints immediately
          setTimeout(async () => {
            await markOrderPrinted(orderToPrint.id, orderToPrint.jobId);
          }, 1000);
          
        }, 1000);
      }
    } catch (err: any) {
      // Don't clutter logs with network errors if server is just restarting, etc.
      // But can log internally.
    }
  };

  const markOrderPrinted = async (orderId: string, jobId?: string) => {
    try {
      addLog(`Marking order ${orderId.slice(0,8)} as printed...`);
      await markOrderPrintedAction(orderId, jobId);
      addLog(`Order marked successfully.`);
      setStatus("idle");
      setCurrentOrder(null);
    } catch (err: any) {
      addLog(`Mark printed error: ${err.message}`);
      setStatus("error");
    } finally {
      // Allow next order to be fetched
      isPrintingRef.current = false;
    }
  };

  useEffect(() => {
    addLog("Print Station initialized. Polling every 5 seconds...");
    const interval = setInterval(fetchPendingOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* --- SCREEN UI (Hidden during print) --- */}
      <div className="print-hide p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Printer className="w-6 h-6 text-brand-orange" />
              Magic POS Print Station
            </h1>
            <p className="text-gray-500 mt-1">
              Keep this window open. Orders will print automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status === "idle" && (
              <span className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full font-medium border border-green-200">
                <CheckCircle className="w-5 h-5" />
                Listening for orders...
              </span>
            )}
            {status === "printing" && (
              <span className="flex items-center gap-2 text-brand-orange bg-orange-50 px-4 py-2 rounded-full font-medium border border-brand-orange/20">
                <Loader2 className="w-5 h-5 animate-spin" />
                Printing Order...
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full font-medium border border-red-200">
                <AlertCircle className="w-5 h-5" />
                Error printing
              </span>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow-sm overflow-hidden flex-1 flex flex-col">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
            Activity Log
          </h3>
          <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="text-green-400">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 italic">No activity yet...</div>
            )}
          </div>
        </div>
      </div>

      {/* --- RECEIPT TEMPLATE (Only visible during print) --- */}
      {currentOrder && (
        <div className="print-show print-receipt">
          {currentOrder.isCancellation ? (
            // --- CANCELLED ORDER RECEIPT SLIP ---
            <div className="cancellation-receipt">
              <div className="receipt-header" style={{ borderBottom: '2px solid black', paddingBottom: '8px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0', textTransform: 'uppercase', color: 'black' }}>
                  *** ORDER CANCELLED ***
                </h1>
                <p className="subtitle" style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>
                  MEHTA SWEET MART
                </p>
              </div>

              <div className="receipt-section" style={{ marginTop: '10px' }}>
                <div className="detail-row"><div className="detail-label">Order Number:</div><div className="detail-value font-bold">{currentOrder.orderNumber}</div></div>
                <div className="detail-row"><div className="detail-label">Customer:</div><div className="detail-value font-bold">{currentOrder.userName}</div></div>
                <div className="detail-row"><div className="detail-label">Mobile:</div><div className="detail-value">{currentOrder.userPhone}</div></div>
                <div className="detail-row"><div className="detail-label">Order Date:</div><div className="detail-value">{new Date(currentOrder.createdAt || new Date()).toLocaleString('en-IN')}</div></div>
                <div className="detail-row"><div className="detail-label">Cancelled At:</div><div className="detail-value">{new Date().toLocaleString('en-IN')}</div></div>
                <div className="detail-row"><div className="detail-label">Payment Status:</div><div className="detail-value">{currentOrder.paymentStatus}</div></div>
                <div className="detail-row"><div className="detail-label">Reason:</div><div className="detail-value font-bold">{currentOrder.cancellationReason || 'Customer Request'}</div></div>
              </div>

              <div className="dashed-divider" style={{ margin: '8px 0' }}></div>

              <table className="receipt-items">
                <thead>
                  <tr className="table-header-row">
                    <th className="left">CANCELLED ITEM</th>
                    <th className="center">QTY</th>
                    <th className="right">AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items && currentOrder.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="left font-semibold">{item.productName} {item.weight ? `(${item.weight})` : ''}</td>
                      <td className="center">{item.quantity}</td>
                      <td className="right">₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="double-divider" style={{ margin: '8px 0' }}></div>

              <div className="summary-row grand-total" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                <span>TOTAL CANCELLED</span>
                <span>₹{currentOrder.total}</span>
              </div>
            </div>
          ) : (
            // --- REGULAR NEW ORDER RECEIPT ---
            <div className="standard-receipt">
              <div className="receipt-header">
                <h2>MEHTA SWEET MART</h2>
                <p className="subtitle">Fresh Sweets & Snacks</p>
                <div className="fancy-divider">
                  <span className="line"></span>
                  <span className="diamond">✧</span>
                  <span className="line"></span>
                </div>
              </div>
              
              <div className="receipt-section">
                <div className="detail-row">
                  <div className="detail-label"><ClipboardList size={12} className="icon"/> Order ID</div>
                  <div className="detail-value">{currentOrder.orderNumber || currentOrder.id?.slice(0,8)}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><CalendarDays size={12} className="icon"/> Date</div>
                  <div className="detail-value">{new Date(currentOrder.createdAt || new Date()).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><Clock size={12} className="icon"/> Time</div>
                  <div className="detail-value">{new Date(currentOrder.createdAt || new Date()).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
              </div>
              
              <div className="dashed-divider"></div>

              <div className="receipt-section">
                <div className="detail-row">
                  <div className="detail-label"><User size={12} className="icon"/> Customer</div>
                  <div className="detail-value font-semibold">{currentOrder.userName}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><Phone size={12} className="icon"/> Phone</div>
                  <div className="detail-value">{currentOrder.userPhone}</div>
                </div>
              </div>

              <div className="dashed-divider"></div>

              <div className="receipt-section">
                <div className="detail-row align-top">
                  <div className="detail-label"><MapPin size={12} className="icon"/> Address</div>
                  <div className="detail-value address-text">
                    {currentOrder.shippingAddress?.street}<br/>
                    {currentOrder.shippingAddress?.city} - {currentOrder.shippingAddress?.pincode}
                  </div>
                </div>
              </div>

              <table className="receipt-items">
                <thead>
                  <tr className="table-header-row">
                    <th className="left">ITEM</th>
                    <th className="center">QTY</th>
                    <th className="right">AMT</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="left font-semibold">{item.productName} {item.weight ? `(${item.weight})` : ''}</td>
                      <td className="center">{item.quantity}</td>
                      <td className="right">₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{currentOrder.subtotal}</span>
                </div>
                {currentOrder.deliveryCharge > 0 && (
                  <div className="summary-row">
                    <span>Delivery Charge</span>
                    <span>₹{currentOrder.deliveryCharge}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Payment Status</span>
                  <span>{currentOrder.paymentStatus}</span>
                </div>
                
                <div className="double-divider"></div>
                
                <div className="summary-row grand-total">
                  <span>TOTAL</span>
                  <span>₹{currentOrder.total}</span>
                </div>
                
                <div className="double-divider"></div>
              </div>

              <div className="receipt-footer">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://mehtadairy.com/track/${currentOrder.id}`)}`} alt="QR Code" className="qr-code" />
                <div className="scan-text">
                  <Smartphone size={10} style={{display: 'inline', marginRight: '2px', verticalAlign: 'text-top'}}/> Scan to track your order
                </div>
                <div className="dashed-divider" style={{margin: '10px 0'}}></div>
                <p className="thank-you"><Heart size={10} style={{display: 'inline', fill: 'black'}}/> Thank You!</p>
                <p>We appreciate your order.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        /* Hide print elements on screen */
        .print-show {
          display: none;
        }

        /* Print Media Query */
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-hide {
            display: none !important;
          }

          .print-show {
            display: block !important;
          }

          /* 80mm Thermal Receipt Styling */
          .print-receipt {
            width: 78mm;
            padding: 4mm 2mm;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: black;
            background: white;
            line-height: 1.4;
          }

          .receipt-header {
            text-align: center;
            margin-bottom: 8px;
          }

          .receipt-header h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
            font-family: serif;
          }

          .subtitle {
            margin: 2px 0 6px;
            font-size: 12px;
            font-weight: 500;
          }

          .fancy-divider {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
          }
          .fancy-divider .line {
            height: 1px;
            background: black;
            flex: 1;
            max-width: 40px;
          }
          .fancy-divider .diamond {
            margin: 0 4px;
            font-size: 10px;
          }

          .dashed-divider {
            border-top: 1px dashed #666;
            margin: 8px 0;
          }

          .double-divider {
            border-top: 3px double black;
            margin: 6px 0;
          }

          .receipt-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .detail-row.align-top {
            align-items: flex-start;
          }

          .detail-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #333;
          }

          .icon {
            stroke-width: 2.5;
          }

          .detail-value {
            font-weight: 600;
            text-align: right;
          }

          .address-text {
            text-align: left;
            font-weight: 500;
            max-width: 65%;
            line-height: 1.3;
          }

          .font-semibold {
            font-weight: 600;
          }

          .receipt-items {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }

          .table-header-row th {
            border-bottom: 1px solid black;
            padding: 4px 0;
            font-size: 10px;
            font-weight: 700;
          }

          .receipt-items td {
            padding: 6px 0;
            vertical-align: top;
            border-bottom: 1px dashed #eee;
          }

          .left { text-align: left; }
          .center { text-align: center; }
          .right { text-align: right; }

          .receipt-summary {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .grand-total {
            font-weight: 800;
            font-size: 16px;
            margin: 2px 0;
          }

          .receipt-footer {
            text-align: center;
            margin-top: 15px;
          }

          .qr-code {
            width: 80px;
            height: 80px;
            margin: 0 auto 5px;
            display: block;
          }

          .scan-text {
            font-size: 10px;
            color: #333;
            margin-bottom: 10px;
          }

          .thank-you {
            font-weight: 700;
            font-size: 12px;
            margin-bottom: 2px;
          }

          .receipt-footer p {
            margin: 2px 0;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
