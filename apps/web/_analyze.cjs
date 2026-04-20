const mammoth = require('mammoth');
mammoth.convertToHtml({path: 'c:/Users/SANZ/sanzmiau/живая/ДР/19.11.2025 1-2 ауысым  СОЛ апта.docx'}).then(r => {
  const h = r.value;
  // Extract table HTML
  const tableMatch = h.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) { console.log('No table found'); return; }
  const tbl = tableMatch[0];
  const rows = [...tbl.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  
  // Parse header with colspan
  const hdrTds = [...rows[0][0].matchAll(/<td(?:\s[^>]*)?>[\s\S]*?<\/td>/gi)];
  console.log('=== HEADER ===');
  hdrTds.forEach((td, i) => {
    const csMatch = td[0].match(/colspan="?(\d+)"?/);
    const cs = csMatch ? parseInt(csMatch[1]) : 1;
    const text = td[0].replace(/<[^>]+>/g, '').trim();
    console.log(`  Cell[${i}] colspan=${cs} "${text.substring(0, 60)}"`);
  });
  
  // Parse data rows (first 5)
  console.log('\n=== DATA ROWS ===');
  for (let ri = 1; ri < Math.min(6, rows.length); ri++) {
    const tds = [...rows[ri][0].matchAll(/<td(?:\s[^>]*)?>[\s\S]*?<\/td>/gi)];
    const cells = tds.map((td, ci) => {
      const text = td[0].replace(/<[^>]+>/g, '').trim();
      return `[${ci}]"${text.substring(0, 40)}"`;
    });
    console.log(`Row${ri}(${tds.length} cells): ${cells.join(' | ')}`);
  }
  
  // Count total rows per table
  const allTables = [...h.matchAll(/<table[\s\S]*?<\/table>/gi)];
  console.log(`\n=== TABLES: ${allTables.length} ===`);
  allTables.forEach((t, i) => {
    const tRows = [...t[0].matchAll(/<tr/gi)];
    console.log(`  Table ${i}: ${tRows.length} rows`);
  });
});
