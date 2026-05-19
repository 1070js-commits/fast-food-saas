"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, Download } from "lucide-react";

export type TicketPrintProps = {
  ticketNumber: string;
  restaurantName: string;
  total: number;
  createdAt: string | Date;
  trackingUrl: string;
  items?: { name: string; qty: number; price: number }[];
};

export function TicketPrint(props: TicketPrintProps) {
  const ref = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: [80, 200] });
    const w = 80;
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, w, h);
    pdf.save(`ticket-${props.ticketNumber}.pdf`);
  };

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className="mx-auto w-[300px] bg-white p-4 text-black font-mono text-sm"
      >
        <header className="text-center border-b pb-2">
          <p className="font-bold uppercase">{props.restaurantName}</p>
          <p className="text-xs">{formatDate(props.createdAt)}</p>
        </header>

        <div className="text-center py-3">
          <p className="text-xs uppercase text-gray-500">Numéro de commande</p>
          <p className="text-4xl font-black">{props.ticketNumber}</p>
        </div>

        {props.items && props.items.length > 0 && (
          <div className="border-t border-b py-2 space-y-1">
            {props.items.map((it, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>
                  {it.qty}× {it.name}
                </span>
                <span>{formatCurrency(it.price * it.qty)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between font-bold py-2">
          <span>TOTAL</span>
          <span>{formatCurrency(props.total)}</span>
        </div>

        <div className="flex flex-col items-center pt-2 border-t">
          <QRCodeSVG value={props.trackingUrl} size={120} />
          <p className="text-[10px] text-center mt-1">
            Scannez pour suivre votre commande
          </p>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm"
        >
          <Printer size={14} /> Imprimer
        </button>
        <button
          onClick={downloadPdf}
          className="inline-flex items-center gap-1 rounded bg-black text-white px-3 py-1.5 text-sm"
        >
          <Download size={14} /> PDF
        </button>
      </div>
    </div>
  );
}
