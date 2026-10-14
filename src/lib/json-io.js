/** Esporta un oggetto/array come file JSON scaricato. */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Apre il selettore file per un JSON e restituisce una Promise con il contenuto parsato.
 * Resolves a `null` se l'utente annulla la selezione.
 */
export function openJSONFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    input.addEventListener('cancel', () => settle(null));
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return settle(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch {
          resolve({ __invalid: true });
        }
      };
      reader.onerror = () => settle(null);
      reader.readAsText(file);
    });

    input.click();
  });
}
