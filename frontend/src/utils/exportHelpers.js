// Helper functions for CSV and PDF export

export const exportToCSV = (data, headers, filename = "report.csv") => {
  if (!data || !data.length) return;

  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(","));

  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape commas and wrap in quotes if string
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      if (Array.isArray(val)) {
        return `"${val.join("; ").replace(/"/g, '""')}"`;
      }
      return val === undefined || val === null ? "" : val;
    });
    csvRows.push(values.join(","));
  }

  // Create file download
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printReport = (title, columns, data) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const tableHeader = columns.map(c => `<th>${c.label}</th>`).join("");
  const tableRows = data.map(row => {
    return `<tr>${columns.map(c => {
      const val = row[c.key];
      if (Array.isArray(val)) return `<td>${val.join(", ")}</td>`;
      if (typeof val === "boolean") return `<td>${val ? "Yes" : "No"}</td>`;
      return `<td>${val !== undefined && val !== null ? val : ""}</td>`;
    }).join("")}</tr>`;
  }).join("");

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            padding: 30px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 15px;
          }
          h1 {
            margin: 0;
            font-size: 24px;
            color: #1e1b4b;
          }
          .meta {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background-color: #f3f4f6;
            color: #4b5563;
            font-weight: bold;
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #d1d5db;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          @media print {
            .no-print { display: none; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="meta">Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | Campus Placement Management Portal</div>
        </div>
        <table>
          <thead>
            <tr>${tableHeader}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            // Optional: Close print window after print dialog is closed
            // window.close();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
