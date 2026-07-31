import ReactMarkdown from 'react-markdown';
import { FiCopy, FiDownload, FiPrinter } from 'react-icons/fi';

export default function ReportViewer({ report, topic }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(report);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${topic.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const htmlContent = report
      .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;margin-top:20px;color:#374151;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;margin-top:24px;color:#1f2937;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;margin-top:28px;color:#111827;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li style="margin-left:20px;">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:20px;">$2</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${topic}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { font-size: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          h2 { font-size: 20px; color: #1f2937; margin-top: 28px; }
          h3 { font-size: 16px; color: #374151; margin-top: 20px; }
          strong { color: #111827; }
          li { margin-left: 20px; margin-bottom: 4px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <p style="font-size:12px;color:#6b7280;">AI Research Assistant Report</p>
        ${htmlContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-secondary-800">
          Research Report
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiCopy className="mr-1.5" size={14} />
            Copy
          </button>
          <button
            onClick={handleDownloadMd}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <FiDownload className="mr-1.5" size={14} />
            .md
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <FiPrinter className="mr-1.5" size={14} />
            PDF
          </button>
        </div>
      </div>
      <div className="px-6 py-6 prose prose-sm max-w-none">
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>
    </div>
  );
}
