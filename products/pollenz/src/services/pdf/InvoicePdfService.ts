import { jsPDF } from 'jspdf';
import type { Invoice, BusinessProfile } from '@/types';

const BLUE = { r: 46, g: 117, b: 182 };
const DARK = { r: 51, g: 51, b: 51 };
const GRID = { r: 200, g: 200, b: 200 };

interface GeneratorOptions {
  invoice: Invoice;
  profile: BusinessProfile;
}

export class InvoicePdfService {
  private doc!: jsPDF;
  private pw!: number;   // page width
  private ph!: number;   // page height
  private ml = 20;       // margin left
  private mr = 20;       // margin right
  private cw!: number;   // content width

  generate({ invoice, profile }: GeneratorOptions): Blob {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pw = this.doc.internal.pageSize.getWidth();
    this.ph = this.doc.internal.pageSize.getHeight();
    this.cw = this.pw - this.ml - this.mr;

    const y = this.renderHeader(profile, invoice);
    const billY = this.renderBillTo(y, invoice, profile);
    this.renderFullPageTable(billY, invoice, profile);

    return this.doc.output('blob');
  }

  download({ invoice, profile }: GeneratorOptions): void {
    const blob = this.generate({ invoice, profile });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Header: Business details left, Invoice info table right ──
  private renderHeader(profile: BusinessProfile, invoice: Invoice): number {
    let y = 18;

    // Business name - large, blue
    this.doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      profile.account_holder || profile.business_name || 'Your Business',
      this.ml, y
    );

    // INVOICE title - large, right
    this.doc.setFontSize(32);
    this.doc.text('INVOICE', this.pw - this.mr, y, { align: 'right' });

    y += 7;
    this.doc.setTextColor(DARK.r, DARK.g, DARK.b);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    // Address lines
    if (profile.address) {
      profile.address.split('\n').forEach(line => {
        this.doc.text(line.trim(), this.ml, y);
        y += 4;
      });
    }

    // Phone
    const infoStartY = y;
    if (profile.phone) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Phone: ${profile.phone}`, this.ml, y);
      this.doc.setFont('helvetica', 'normal');
      y += 4.5;
    }

    // Bank details
    if (profile.bank_name && profile.account_number) {
      this.doc.text(
        `${profile.bank_name} ${(profile.account_type || 'Cheque').charAt(0).toUpperCase() + (profile.account_type || 'cheque').slice(1).toLowerCase()} account`,
        this.ml, y
      );
      y += 4;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(profile.account_number, this.ml, y);
      this.doc.setFont('helvetica', 'normal');
      y += 4;
    }

    // ── Invoice info table (right side, aligned with phone line) ──
    const tw = 82;          // table width
    const tx = this.pw - this.mr - tw;
    const hw = tw / 2;      // half width
    const rh = 6.5;         // row height
    let ty = infoStartY - 5;

    // Row 1: INVOICE # | DATE (blue header)
    this.blueBar(tx, ty, tw, rh);
    this.whiteText(8, 'bold');
    this.doc.text('INVOICE #', tx + 3, ty + 4.5);
    this.doc.text('DATE', tx + hw + 3, ty + 4.5);
    ty += rh;

    // Row 2: values
    this.gridCell(tx, ty, hw, rh);
    this.gridCell(tx + hw, ty, hw, rh);
    this.darkText(9, 'normal');
    this.doc.text(invoice.invoice_number, tx + hw / 2, ty + 4.5, { align: 'center' });
    this.doc.text(this.fmtDate(invoice.invoice_date), tx + hw + hw / 2, ty + 4.5, { align: 'center' });
    ty += rh;

    // Row 3: CUSTOMER ID | TERMS (blue header)
    this.blueBar(tx, ty, tw, rh);
    this.whiteText(8, 'bold');
    this.doc.text('CUSTOMER ID', tx + 3, ty + 4.5);
    this.doc.text('TERMS', tx + hw + 3, ty + 4.5);
    ty += rh;

    // Row 4: values
    this.gridCell(tx, ty, hw, rh);
    this.gridCell(tx + hw, ty, hw, rh);
    this.darkText(9, 'normal');
    this.doc.text(invoice.client?.client_code || '', tx + hw / 2, ty + 4.5, { align: 'center' });
    this.doc.text(profile.payment_terms || '', tx + hw + hw / 2, ty + 4.5, { align: 'center' });

    return Math.max(y, ty + rh) + 5;
  }

  // ── Bill To section ──
  private renderBillTo(startY: number, invoice: Invoice, profile: BusinessProfile): number {
    let y = startY;

    // BILL TO blue bar (left half only, to leave room on right if needed)
    this.blueBar(this.ml, y, this.cw, 6);
    this.whiteText(8, 'bold');
    this.doc.text('BILL TO', this.ml + 3, y + 4.2);
    y += 9;

    this.darkText(9, 'normal');
    if (invoice.client) {
      if (invoice.client.contact_person) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(invoice.client.contact_person, this.ml, y);
        this.doc.setFont('helvetica', 'normal');
        y += 4.5;
      }
      this.doc.text(invoice.client.name, this.ml, y);
      y += 4.5;
      if (invoice.client.address) {
        invoice.client.address.split('\n').forEach(line => {
          this.doc.text(line.trim(), this.ml, y);
          y += 4.5;
        });
      }
      if (invoice.client.phone) {
        this.doc.text(invoice.client.phone, this.ml, y);
        y += 4.5;
      }
      if (invoice.client.email) {
        this.doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
        this.doc.text(invoice.client.email, this.ml, y);
        this.doc.setTextColor(DARK.r, DARK.g, DARK.b);
        y += 4.5;
      }
    }

    return y + 4;
  }

  // ── Full-page line items table with grid extending to bottom ──
  private renderFullPageTable(startY: number, invoice: Invoice, profile: BusinessProfile): void {
    const rh = 6.5;         // row height
    const footerY = this.ph - 30;  // where totals start
    const contactY = this.ph - 14; // contact footer

    // Column widths
    const descW = this.cw * 0.50;
    const qtyW = this.cw * 0.12;
    const priceW = this.cw * 0.19;
    const amtW = this.cw * 0.19;

    // ── Table header (blue bar) ──
    let y = startY;
    this.blueBar(this.ml, y, this.cw, 7);
    this.whiteText(8, 'bold');
    this.doc.text('DESCRIPTION', this.ml + 3, y + 5);
    this.doc.text('QTY', this.ml + descW + qtyW - 3, y + 5, { align: 'right' });
    this.doc.text('UNIT PRICE', this.ml + descW + qtyW + priceW - 3, y + 5, { align: 'right' });
    this.doc.text('AMOUNT', this.ml + this.cw - 3, y + 5, { align: 'right' });
    y += 7;

    const tableTop = y;

    // ── Data rows ──
    this.darkText(9, 'normal');
    invoice.items.forEach(item => {
      if (y + rh > footerY - 30) return; // safety margin

      this.doc.text(item.description, this.ml + 3, y + 4.5);
      this.doc.text(String(item.quantity), this.ml + descW + qtyW - 3, y + 4.5, { align: 'right' });
      this.doc.text(this.fmtNum(item.unit_price), this.ml + descW + qtyW + priceW - 3, y + 4.5, { align: 'right' });
      this.doc.text(this.fmtNum(item.amount), this.ml + this.cw - 3, y + 4.5, { align: 'right' });

      y += rh;
    });

    // ── Notes rows (within the table, if invoice has notes) ──
    if (invoice.notes) {
      y += rh; // skip a row
      this.doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
      this.doc.setFont('helvetica', 'bold');
      invoice.notes.split('\n').forEach(line => {
        if (y + rh > footerY - 30) return;
        this.doc.text(line.trim(), this.ml + 3, y + 4.5);
        y += rh;
      });
      this.doc.setTextColor(DARK.r, DARK.g, DARK.b);
      this.doc.setFont('helvetica', 'normal');
    }

    // ── Draw grid lines for ALL rows (including empty) down to totals ──
    const gridBottom = footerY - 5;
    this.doc.setDrawColor(GRID.r, GRID.g, GRID.b);
    this.doc.setLineWidth(0.3);

    // Horizontal lines for each row
    let gy = tableTop;
    while (gy <= gridBottom) {
      this.doc.line(this.ml, gy, this.ml + this.cw, gy);
      gy += rh;
    }
    // Final bottom line
    this.doc.line(this.ml, gridBottom, this.ml + this.cw, gridBottom);

    // Vertical column separators (full height)
    const colX = [
      this.ml,
      this.ml + descW,
      this.ml + descW + qtyW,
      this.ml + descW + qtyW + priceW,
      this.ml + this.cw,
    ];
    colX.forEach(x => {
      this.doc.line(x, tableTop, x, gridBottom);
    });

    // ── "Thank you" and Totals (pinned to bottom) ──
    const totW = 80;
    const totX = this.pw - this.mr - totW;
    const totHalf = totW / 2;
    let ty = footerY - 2;

    // "Thank you" on left
    this.doc.setTextColor(BLUE.r, BLUE.g, BLUE.b);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bolditalic');
    this.doc.text('Thank you for your business!', this.ml + 3, ty + 8);

    // Totals table on right
    this.darkText(9, 'normal');
    this.doc.setDrawColor(GRID.r, GRID.g, GRID.b);

    // Subtotal
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SUBTOTAL', totX + 3, ty + 4);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.fmtMoney(invoice.subtotal), totX + totW - 3, ty + 4, { align: 'right' });
    ty += 5;

    // Tax Rate & Tax (only show if tax_rate > 0)
    if (Number(invoice.tax_rate || 0) > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('TAX RATE', totX + 3, ty + 4);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${Number(invoice.tax_rate).toFixed(3)}%`, totX + totW - 3, ty + 4, { align: 'right' });
      ty += 5;

      this.doc.setFont('helvetica', 'bold');
      this.doc.text('TAX', totX + 3, ty + 4);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(this.fmtMoney(invoice.tax_amount), totX + totW - 3, ty + 4, { align: 'right' });
      ty += 5;
    }

    // Total (bold, larger)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text('TOTAL', totX + 3, ty + 4);
    this.doc.text(`R${this.fmtMoney(invoice.total)}`, totX + totW - 3, ty + 4, { align: 'right' });

    // ── Contact footer (very bottom) ──
    this.doc.setTextColor(DARK.r, DARK.g, DARK.b);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    const cx = this.pw / 2;
    this.doc.text('If you have any questions about this invoice, please contact', cx, contactY, { align: 'center' });

    const name = profile.account_holder || profile.business_name || 'Us';
    let contact = name;
    if (profile.phone) contact += `, ${profile.phone}`;
    if (profile.email) contact += `, ${profile.email}`;
    this.doc.text(contact, cx, contactY + 4, { align: 'center' });
  }

  // ── Helpers ──
  private blueBar(x: number, y: number, w: number, h: number): void {
    this.doc.setFillColor(BLUE.r, BLUE.g, BLUE.b);
    this.doc.rect(x, y, w, h, 'F');
  }

  private gridCell(x: number, y: number, w: number, h: number): void {
    this.doc.setDrawColor(GRID.r, GRID.g, GRID.b);
    this.doc.rect(x, y, w, h);
  }

  private whiteText(size: number, style: string): void {
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
  }

  private darkText(size: number, style: string): void {
    this.doc.setTextColor(DARK.r, DARK.g, DARK.b);
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
  }

  private fmtMoney(amount: number): string {
    return (amount || 0).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).replace(/,/g, ' ');
  }

  private fmtNum(amount: number): string {
    return (amount || 0).toLocaleString('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).replace(/,/g, ' ');
  }

  private fmtDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
}

export const invoicePdfService = new InvoicePdfService();
