const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let qEditor = null;

let appState = {
  currentfile: "../autosave.txt",
  autosavefile: "",
  content: ""
};

ipcRenderer.on('filepath', (event, data) => {
  appState.currentfile = data;
  appState.autosavefile = path.join(path.dirname(data), ".auto." + path.basename(data, '.txt'));
  document.body.querySelector('.title').innerHTML = path.basename(data);
});

ipcRenderer.on('fileData', (event, data) => {
  qEditor.setText(data);
  appState.content = qEditor.getContents();
  localStorage.setItem("state", JSON.stringify(appState));
});

ipcRenderer.on('saveto', (event, data) => {
  appState.currentfile = data;
  appState.autosavefile = path.join(path.dirname(data), ".auto." + path.basename(data, '.txt'));
  document.body.querySelector('.title').innerHTML = path.basename(data);
  fs.writeFileSync(appState.currentfile, qEditor.getText(), 'utf-8');
});

contextBridge.exposeInMainWorld('app', {

  close: () => {
    ipcRenderer.send('closeApp');
  },

  'tooglemaxmin': () => {
    ipcRenderer.send('toggleMaxWnd');
  },

  'start': () => {

    const feather = require('feather-icons');
    feather.replace();

    const Quill = require('quill');
    qEditor = new Quill('#quill-container', {
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline']
        ]
      },
      scrollingContainer: '#scrolling-container',
      theme: 'bubble'//,
      //placeholder: 'write here'
    });

    const lastState = localStorage.getItem("state");
    if (lastState) {
      appState = JSON.parse(lastState);
      console.log("state",appState);
      qEditor.setContents(appState.content);
      document.body.querySelector('.title').innerHTML = path.basename(appState.currentfile, '.txt');
    }

    qEditor.on('text-change', function (delta, oldDelta, source) {
      // if (source == 'api') {
      //   // console.log("An API call triggered this change.");
      // } else if (source == 'user') {
      //   // console.log("A user action triggered this change.");
      // }
      if (source == 'user') {
        appState.content = qEditor.getContents();
        localStorage.setItem("state", JSON.stringify(appState));
        fs.writeFileSync(appState.autosavefile, JSON.stringify(appState.content), 'utf-8');
      }
    });
  },

  'newfile': () => {
    ipcRenderer.send('newfile');
    document.body.querySelector('.submenu').classList.toggle('show');
  },

  'openfile': () => {
    ipcRenderer.send('openFile');
    document.body.querySelector('.submenu').classList.toggle('show');
  },

  'savefile': () => {
    ipcRenderer.send('savefile');
    document.body.querySelector('.submenu').classList.toggle('show');
  }
});






