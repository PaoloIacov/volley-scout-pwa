const DRIVE_FOLDER_ID = '18Kj3Quz4RZAppn3ng9XJo5TiWXbPWzFJ';
const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

let scriptPromise;
let tokenClient;
let accessToken = null;

function clientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Impossibile caricare il servizio di autenticazione Google.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function getAccessToken() {
  if (!clientId()) {
    throw new Error('Configura VITE_GOOGLE_CLIENT_ID per usare la sincronizzazione Google Drive.');
  }
  if (accessToken) return accessToken;

  const google = await loadGoogleIdentityServices();
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(`Autenticazione Google non riuscita: ${response.error}`));
          return;
        }
        accessToken = response.access_token;
        resolve(accessToken);
      },
      error_callback: (error) => reject(new Error(error?.type ?? 'Autenticazione Google annullata.')),
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function driveRequest(url, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
  if (!response.ok) {
    if (response.status === 401) accessToken = null;
    const message = await response.text();
    throw new Error(`Google Drive ha restituito ${response.status}: ${message || response.statusText}`);
  }
  return response;
}

export function googleDriveConfigurato() {
  return Boolean(clientId());
}

export function nomeFileJSON(prefix = 'backup_volley_scout') {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', '_').replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
  return `${prefix}_${timestamp}.json`;
}

export async function uploadJSONToDrive(data, filename = nomeFileJSON()) {
  const metadata = {
    name: filename,
    parents: [DRIVE_FOLDER_ID],
    mimeType: 'application/json',
  };
  const boundary = `-------volley-scout-${Date.now()}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(data, null, 2),
    `--${boundary}--`,
  ].join('\r\n');

  const response = await driveRequest(
    `${UPLOAD_API_URL}?uploadType=multipart&fields=id,name,createdTime`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return response.json();
}

export async function downloadLatestJSONFromDrive() {
  const query = encodeURIComponent(
    `'${DRIVE_FOLDER_ID}' in parents and trashed = false and mimeType = 'application/json'`,
  );
  const response = await driveRequest(
    `${DRIVE_API_URL}/files?q=${query}&orderBy=createdTime%20desc&pageSize=100&fields=files(id,name,createdTime)`,
  );
  const { files = [] } = await response.json();
  if (!files.length) throw new Error('Nessun backup JSON trovato nella cartella Google Drive.');

  const latest = files[0];
  const content = await driveRequest(
    `${DRIVE_API_URL}/files/${encodeURIComponent(latest.id)}?alt=media`,
  );
  try {
    return { data: await content.json(), filename: latest.name };
  } catch {
    throw new Error(`Il file più recente (${latest.name}) non contiene JSON valido.`);
  }
}

export function disconnettiGoogleDrive() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
}
