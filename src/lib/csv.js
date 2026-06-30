// Utilidades para importar/exportar CSV (compatibles con Excel), sin dependencias externas.

// Convierte un valor a string seguro para CSV
function escapeCell(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Exporta un array de objetos a CSV y descarga el archivo.
// columns: array de { key, label } opcional. Si no se pasa, usa las keys del primer registro.
export function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename);
    return;
  }
  const cols = columns && columns.length
    ? columns
    : Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const header = cols.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) =>
    cols.map((c) => escapeCell(row[c.key])).join(",")
  );
  const csv = "\uFEFF" + [header, ...body].join("\n"); // BOM para Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Parsea texto CSV a array de objetos. Soporta comas, comillas y saltos dentro de celdas.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(cell); cell = ""; i++; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = ""; i++; continue;
    }
    cell += ch; i++;
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// Lee un archivo (CSV) y devuelve array de filas (arrays de strings)
export function readFileAsCsv(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCsv(e.target.result);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file, "UTF-8");
  });
}