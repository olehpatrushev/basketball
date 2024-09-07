import {
    pSBC
} from "./helpers/color.js"

import {
    ScreenService
} from "./services/screen.js"

import {
    SegmentService
} from "./services/segment.js"

import {
    LocalStorageService
} from "./services/local_storage.js"

import {
    ShotService
} from "./services/shot.js"

import {
    SceneService
} from "./services/scene.js"

import {
    CacheService
} from "./services/cache.js"

import {
    DataService
} from "./services/data.js"

const app = {};

app.baseURL = '//shotv1.4natic.online';
//const baseURL = '//shotv1.stacqan.com';

// Получаем данные из LocalStorage

const urlParams = new URLSearchParams(window.location.search);

const sceneBase64 = urlParams.get('scene');
if (sceneBase64) {
    try {
        const decodedString = atob(sceneBase64);
        window.localStorage.setItem('air', decodedString);
        console.log('Данные успешно загружены из url');
    } catch (error) {
        console.error('Ошибка при декодировании или парсинге:', error);
    }
}

app.IS_CHROMAKEY = urlParams.has('IS_CHROMAKEY');
app.IS_DEV = urlParams.has('IS_DEV');

app.runtime = {
    shots: [],
    loaded: false,
    currentShotIndex: 0
};

// Generate the Babylon.js engine
app.canvas = document.getElementById('renderCanvas');
app.engine = new BABYLON.Engine(app.canvas, true);
app.scene = new BABYLON.Scene(app.engine);

app.screenService = new ScreenService(app);
app.segmentService = new SegmentService(app);
app.shotService = new ShotService(app);
app.cacheService = new CacheService(app);
app.sceneService = new SceneService(app);
app.dataService = new DataService(app);
app.localStorageService = new LocalStorageService(app);

app.extractedData = app.localStorageService.extractDataFromLocalStorage();

if (app.IS_CHROMAKEY) {
    app.mainColor = '#00FF00';
} else {
    // Устанавливаем основной цвет из данных, полученных из LocalStorage
    app.mainColor = app.extractedData && app.extractedData.color ? app.extractedData.color : '#00f6ff';
}

app.supportColor1 = pSBC(-0.5, app.mainColor, false, true);
app.supportColor2 = pSBC(-0.7, app.mainColor, false, true);
app.supportColor3 = pSBC(-0.8, app.mainColor, false, true);

window.addEventListener("keydown", function (event) {
    if (event.key === 'e') {
        let base64String = btoa(localStorage.getItem('air'));
        let urlWithoutParams = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${window.location.pathname}`;
        let urlFull = urlWithoutParams + '?scene=' + base64String;
        navigator.clipboard.writeText(urlFull);
        console.log(urlFull);
    }
});

const logCameraParameters = function (camera) {
    console.log("Camera Position:", app.camera.position);
    console.log("Camera Alpha:", app.camera.alpha);
    console.log("Camera Beta:", app.camera.beta);
    console.log("Camera Radius:", app.camera.radius);
    console.log("Camera Target:", app.camera.target);
};

// Register a render loop to repeatedly render the scene
app.startLoop = () => {
    app.engine.runRenderLoop(function () {
        app.shotService.process();

        app.scene.render();

        //logCameraParameters(scene.activeCamera);
    });
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});

// Optionally log camera parameters on key press (e.g., 'p' for print)
window.addEventListener("keydown", function (event) {
    if (event.key === 'p') {
        logCameraParameters(app.scene.activeCamera);
    }
});

app.sceneService.setUpScene();

if (app.IS_DEV) {
    window.app = app;
}