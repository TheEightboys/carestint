'use client';

/**
 * Export Utilities for CareStint
 * Handles PDF and CSV exports for reports and data
 */

/**
 * Export data as CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Determine columns
    const cols = columns || Object.keys(data[0]).map(key => ({ key: key as keyof T, label: key }));

    // Create header row
    const headers = cols.map(col => `"${String(col.label)}"`).join(',');

    // Create data rows
    const rows = data.map(item =>
        cols.map(col => {
            const value = item[col.key];
            // Handle different types
            if (value === null || value === undefined) return '""';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            if (typeof value === 'object' && value !== null && 'toISOString' in value) {
                return `"${(value as { toISOString: () => string }).toISOString()}"`;
            }
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${value}"`;
        }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;

    // Download
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data as PDF report
 * Uses HTML-to-PDF approach for simplicity
 */
export function exportToPDF(
    title: string,
    content: {
        subtitle?: string;
        summary?: string;
        data?: Array<{ label: string; value: string | number }>;
        tableData?: { headers: string[]; rows: string[][] };
        footer?: string;
    },
    filename: string
): void {
    const htmlContent = generatePDFHtml(title, content);

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Trigger print dialog after content loads
        printWindow.onload = () => {
            printWindow.print();
        };
    }
}

/**
 * Generate HTML for PDF export
 */
function generatePDFHtml(
    title: string,
    content: {
        subtitle?: string;
        summary?: string;
        data?: Array<{ label: string; value: string | number }>;
        tableData?: { headers: string[]; rows: string[][] };
        footer?: string;
    }
): string {
    const now = new Date().toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title} - CareStint Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #14b8a6; }
        .date { color: #666; font-size: 12px; }
        h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; line-height: 1.6; }
        .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .data-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #14b8a6; }
        .data-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .data-value { font-size: 24px; font-weight: bold; color: #1a1a1a; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #14b8a6; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">CareStint</div>
        <div class="date">Generated: ${now}</div>
    </div>
    <h1>${title}</h1>
    ${content.subtitle ? `<div class="subtitle">${content.subtitle}</div>` : ''}
    ${content.summary ? `<div class="summary">${content.summary}</div>` : ''}
    ${content.data ? `<div class="data-grid">${content.data.map(item => `<div class="data-item"><div class="data-label">${item.label}</div><div class="data-value">${item.value}</div></div>`).join('')}</div>` : ''}
    ${content.tableData ? `<table><thead><tr>${content.tableData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${content.tableData.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
    <div class="footer">${content.footer || 'CareStint - Healthcare Staffing Platform'}</div>
</body>
</html>`;
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export invoices as CSV
 */
export function exportInvoicesCSV(invoices: Record<string, unknown>[]): void {
    exportToCSV(invoices, 'carestint-invoices', [
        { key: 'invoiceNumber', label: 'Invoice Number' },
        { key: 'invoiceType', label: 'Type' },
        { key: 'amount', label: 'Amount (KES)' },
        { key: 'isPaid', label: 'Status' },
        { key: 'issuedAt', label: 'Issue Date' },
        { key: 'dueAt', label: 'Due Date' },
    ]);
}

/**
 * Export stints as CSV
 */
export function exportStintsCSV(stints: Record<string, unknown>[]): void {
    exportToCSV(stints, 'carestint-stints', [
        { key: 'id', label: 'Stint ID' },
        { key: 'role', label: 'Role' },
        { key: 'shiftType', label: 'Shift Type' },
        { key: 'shiftDate', label: 'Date' },
        { key: 'city', label: 'Location' },
        { key: 'offeredRate', label: 'Rate (KES)' },
        { key: 'status', label: 'Status' },
    ]);
}

/**
 * Export earnings report as PDF
 */
export function exportEarningsReport(
    professionalName: string,
    period: string,
    earnings: { total: number; stints: number; averageRate: number },
    details: Array<{ date: string; facility: string; role: string; amount: number }>
): void {
    exportToPDF(
        'Earnings Report',
        {
            subtitle: `${professionalName} | ${period}`,
            summary: `Completed ${earnings.stints} stints with average rate of KES ${earnings.averageRate.toLocaleString()}.`,
            data: [
                { label: 'Total Earnings', value: `KES ${earnings.total.toLocaleString()}` },
                { label: 'Completed Stints', value: earnings.stints },
                { label: 'Average Rate', value: `KES ${earnings.averageRate.toLocaleString()}` },
                { label: 'Period', value: period },
            ],
            tableData: details.length > 0 ? {
                headers: ['Date', 'Facility', 'Role', 'Amount'],
                rows: details.map(d => [d.date, d.facility, d.role, `KES ${d.amount?.toLocaleString() || 0}`])
            } : undefined,
        },
        `earnings-report-${Date.now()}`
    );
}
