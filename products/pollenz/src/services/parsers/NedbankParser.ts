import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction, ParseResult } from '@/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export class NedbankParser extends BaseBankParser {
  get bankName(): string {
    return 'Nedbank';
  }

  get expectedColumns(): string[] {
    return ['date', 'description', 'amount', 'balance'];
  }

  async parseFile(file: File): Promise<ParseResult> {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    return isExcel ? this.parseExcelFile(file) : this.parseCsvFile(file);
  }

  private async parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: (string | number | Date)[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd',
          });

          const transactions: ParsedTransaction[] = [];
          this.errors = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i].map((cell) => String(cell ?? '').trim());
            const transaction = this.mapRowArray(row, i);
            if (transaction) transactions.push(transaction);
          }

          resolve(this.buildParseResult(transactions, rows.length));
        } catch (error) {
          resolve({
            success: false,
            transactions: [],
            errors: [{
              row: 0, field: 'file',
              message: error instanceof Error ? error.message : 'Failed to parse Excel file',
              rawValue: null,
            }],
            warnings: [],
            stats: { totalRows: 0, parsedRows: 0, skippedRows: 0, dateRange: null },
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          transactions: [],
          errors: [{ row: 0, field: 'file', message: 'Failed to read file', rawValue: null }],
          warnings: [],
          stats: { totalRows: 0, parsedRows: 0, skippedRows: 0, dateRange: null },
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private parseCsvFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const transactions: ParsedTransaction[] = [];
          this.errors = [];
          const rows = results.data as string[][];

          for (let i = 0; i < rows.length; i++) {
            const transaction = this.mapRowArray(rows[i], i);
            if (transaction) transactions.push(transaction);
          }

          resolve(this.buildParseResult(transactions, rows.length));
        },
        error: (error) => {
          resolve({
            success: false,
            transactions: [],
            errors: [{ row: 0, field: 'file', message: error.message, rawValue: null }],
            warnings: [],
            stats: { totalRows: 0, parsedRows: 0, skippedRows: 0, dateRange: null },
          });
        },
      });
    });
  }

  private buildParseResult(transactions: ParsedTransaction[], totalRows: number): ParseResult {
    let dateRange: { start: string; end: string } | null = null;
    if (transactions.length > 0) {
      const dates = transactions.map((t) => t.transactionDate).sort();
      dateRange = { start: dates[0], end: dates[dates.length - 1] };
    }

    return {
      success: this.errors.length === 0,
      transactions,
      errors: this.errors,
      warnings: [],
      stats: {
        totalRows,
        parsedRows: transactions.length,
        skippedRows: totalRows - transactions.length - this.errors.length,
        dateRange,
      },
    };
  }

  private mapRowArray(row: string[], rowIndex: number): ParsedTransaction | null {
    if (row.length < 3) return null;

    const [dateStr, description, amountStr, balanceStr] = row.map((v) => v?.trim() || '');

    if (this.isMetadataRow(dateStr, description)) return null;
    if (this.isSummaryRow(description)) return null;
    if (!this.isValidNedbankDate(dateStr)) return null;
    if (!amountStr || amountStr === '') return null;

    try {
      const amount = this.parseAmount(amountStr);
      const balance = balanceStr ? this.parseAmount(balanceStr) : null;
      const transactionDate = this.parseNedbankDate(dateStr);

      return {
        transactionDate,
        description: this.cleanDescription(description),
        amount,
        balanceAfter: balance,
        bankReference: this.extractReference(description),
        rawDescription: description,
        importSource: 'csv',
      };
    } catch (error) {
      this.errors.push({
        row: rowIndex,
        field: 'parsing',
        message: error instanceof Error ? error.message : 'Parse error',
        rawValue: row.join(','),
      });
      return null;
    }
  }

  private isMetadataRow(dateStr: string, description: string): boolean {
    const metadataIndicators = [
      'statement enquiry', 'account number', 'account description', 'statement number',
    ];
    const combined = `${dateStr} ${description}`.toLowerCase();
    return metadataIndicators.some((m) => combined.includes(m));
  }

  private isSummaryRow(description: string): boolean {
    const summaryIndicators = [
      'opening balance', 'closing balance', 'carried forward', 'brought forward',
      'balance brought', 'balance carried', 'total', 'subtotal',
    ];
    const lower = description.toLowerCase();
    return summaryIndicators.some((s) => lower.includes(s));
  }

  private isValidNedbankDate(dateStr: string): boolean {
    return /^\d{1,2}[A-Za-z]{3}\d{4}$/.test(dateStr) ||
      /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(dateStr) ||
      /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  private parseNedbankDate(dateStr: string): string {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

    let match = dateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const [, day, monthStr, year] = match;
      const month = months[monthStr.toLowerCase()];
      if (!month) throw new Error(`Invalid month: ${monthStr}`);
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }

    match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (match) {
      const [, day, monthStr, year] = match;
      const month = months[monthStr.toLowerCase()];
      if (!month) throw new Error(`Invalid month: ${monthStr}`);
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }

    match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return dateStr;

    throw new Error(`Invalid date format: ${dateStr}`);
  }

  private extractReference(description: string): string | null {
    const patterns = [
      /\*(\w+)\*/,
      /(\d{10,})/,
      /CARD\s+(\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(description);
      if (match) return match[1];
    }
    return null;
  }

  mapRow(row: Record<string, string>, rowIndex: number): ParsedTransaction | null {
    const values = Object.values(row);
    return this.mapRowArray(values, rowIndex);
  }
}
