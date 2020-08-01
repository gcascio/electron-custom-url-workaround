const {app, BrowserWindow} = require('electron');
const path = require('path');

function createMainWindow () {   
  const mainWindow = new BrowserWindow({ width: 800, height: 600 });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
}      

app.on('ready', createMainWindow);
