/** Builds a CSV string. Cells that start with = + - @ are prefixed so spreadsheets don't run them as formulas. */
export function toCsv(rows: (string | number | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let text = cell === undefined ? "" : String(cell);
          if (/^[=+\-@]/.test(text)) text = `'${text}`;
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
