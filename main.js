const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let updateCheckStarted = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#080809',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('ERROR AL CARGAR:', code, description, url);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('ERROR DEL RENDERER:', details);
  });
}

function setupAutoUpdates() {
  // El actualizador solo funciona en la aplicación instalada/empacada.
  if (!app.isPackaged || updateCheckStarted) return;
  updateCheckStarted = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('DeviChipeo: buscando actualizaciones...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`DeviChipeo: actualización ${info.version} encontrada.`);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('DeviChipeo ya está actualizado.');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`Descargando actualización: ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      autoUpdater.quitAndInstall();
      return;
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'DeviChipeo Premium — actualización lista',
      message: `La versión ${info.version} está lista para instalar.`,
      detail: 'Guarda lo que estés haciendo. DeviChipeo se reiniciará para completar la actualización. Tus canciones y playlists guardadas fuera de la instalación no se borrarán.',
      buttons: ['Actualizar y reiniciar', 'Después'],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('No se pudo actualizar DeviChipeo:', error);
  });

  // Espera a que la ventana cargue para no competir con el arranque de la app.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('Error comprobando actualizaciones:', error);
    });
  }, 4000);
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
