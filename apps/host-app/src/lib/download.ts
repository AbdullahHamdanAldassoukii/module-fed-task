export function downloadTextFile(fileName: string, text: string, mimeType = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Some browsers start downloads after click returns.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
