/**
 * AA Trading Intelligence – Upload Handler
 *
 * Wires file drag-drop / file-input to the AADataProcessor.
 * Validates schema, builds trades, deduplicates, and updates window.AAData.
 *
 * Depends on: PapaParse (CSV), SheetJS XLSX (xlsx), and aa_data_processor.js
 *
 * Public API:
 *   AAUploadHandler.handle(files, AAData, toastFn)
 *
 * (c) AA Trading Intelligence – 2026
 */
(function (root) {
  'use strict';

  function isCSV(name)  { return /\.csv$/i.test(name); }
  function isXLSX(name) { return /\.xlsx?$/i.test(name); }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error("Could not read " + file.name));
      if (isXLSX(file.name)) reader.readAsArrayBuffer(file);
      else                   reader.readAsText(file);
    });
  }

  function parseRows(file, content) {
    if (isCSV(file.name)) {
      const allLines   = content.split('\n');
      const dataLines  = allLines.filter(l => !l.trim().startsWith('#'));

      function tryParse(lines) {
        const r = Papa.parse(lines.join('\n').trim(), {
          header: true, skipEmptyLines: true, dynamicTyping: false
        });
        return (r && r.data && r.data.length) ? r.data : [];
      }

      let rows = tryParse(dataLines);

      if (rows.length && AADataProcessor.detectFormat(rows) === 'unknown') {
        const withoutMeta = dataLines.slice(1);
        const retry = tryParse(withoutMeta);
        if (retry.length && AADataProcessor.detectFormat(retry) !== 'unknown') {
          rows = retry;
        }
      }

      return rows;
    }
    if (isXLSX(file.name)) {
      const wb = XLSX.read(content, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }
    throw new Error("Unsupported file type: " + file.name);
  }

  function validate(rows) {
    if (!rows || !rows.length) throw new Error("No rows parsed.");
    const fmt = AADataProcessor.detectFormat(rows);
    if (fmt === "unknown") {
      throw new Error("Unrecognized schema. Expected Schwab/TOS Orders, IBKR Flex, AA cleaned trades, or generic Date/Side/Price.");
    }
    return fmt;
  }

  async function handle(files, AAData, toast) {
    let totalAdded = 0, totalSkipped = 0;
    for (const file of files) {
      try {
        toast && toast("Processing", file.name + " – parsing…", "");
        const content = await readFile(file);
        const rows = parseRows(file, content);
        const fmt = validate(rows);
        const norm = AADataProcessor.normalizeFills(rows, fmt);

        let incomingTrades;
        if (norm.type === "trades") {
          incomingTrades = norm.rows;
        } else {
          incomingTrades = AADataProcessor.buildTrades(norm.rows, {
            starting_equity: AAData.starting_equity,
            commission_side: AAData.commission_side,
            multiplier:      AAData.multiplier
          });
        }

        const { merged, added, skipped } = AADataProcessor.dedupe(AAData.trades || [], incomingTrades);
        AAData.trades = merged;
        AAData.kpis   = AADataProcessor.computeKPIs(merged, AAData);

        totalAdded   += added;
        totalSkipped += skipped;

        toast && toast("Imported", `${file.name} – ${added} new trade(s), ${skipped} duplicates skipped (${fmt} format).`, "success");
      } catch (err) {
        console.error(err);
        toast && toast("Upload failed", `${file.name}: ${err.message}`, "error");
      }
    }
    if (totalAdded > 0) {
      toast && toast("Dataset updated",
        `Added ${totalAdded} trade(s). Reload the dashboard or hit Refresh to see updated KPIs.`,
        "success");
    }
    return { added: totalAdded, skipped: totalSkipped };
  }

  function startAutoRefresh(intervalMin, callback) {
    if (!intervalMin) return null;
    return setInterval(() => {
      try { callback && callback(); }
      catch (e) { console.error("AA auto-refresh:", e); }
    }, intervalMin * 60 * 1000);
  }

  root.AAUploadHandler = { handle, startAutoRefresh };
})(typeof window !== 'undefined' ? window : globalThis);
