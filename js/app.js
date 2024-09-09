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

import {
    ColorService
} from "./services/color.js"

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
app.IS_TEST = urlParams.has('IS_TEST');
if(app.IS_TEST) {
    app.IS_CHROMAKEY = true;
}

app.runtime = {
    shots: [],
    loaded: false,
    currentShotIndex: 0
};

// Generate the Babylon.js engine
app.canvas = document.getElementById('renderCanvas');
app.engine = new BABYLON.Engine(app.canvas, true);
app.scene = new BABYLON.Scene(app.engine);


//Enabling the cache
if(!app.IS_TEST && !app.IS_DEV) {
    BABYLON.Database.IDBStorageEnabled = true;
    app.engine.enableOfflineSupport = true;
}

app.screenService = new ScreenService(app);
app.segmentService = new SegmentService(app);
app.shotService = new ShotService(app);
app.cacheService = new CacheService(app);
app.sceneService = new SceneService(app);
app.dataService = new DataService(app);
app.colorService = new ColorService(app);
app.localStorageService = new LocalStorageService(app);

app.extractedData = app.localStorageService.extractDataFromLocalStorage();

app.colorService.updateColors();

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
        app.segmentService.process();

        app.scene.render();
        
        if (app.IS_TEST) {
            const fpsLabel = document.getElementById("fpsLabel");
            fpsLabel.innerHTML = app.engine.getFps().toFixed() + " fps";
        }
        //logCameraParameters(scene.activeCamera);
    });
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    app.engine.resize();
});

// Optionally log camera parameters on key press (e.g., 'p' for print)
window.addEventListener("keydown", function (event) {
    if (event.key === 'p') {
        logCameraParameters(app.scene.activeCamera);
    }
});

window.addEventListener("storage", function (event) {
    if (event.key === "air") {
        console.log("loacalStorage changed");
        app.extractedData = app.localStorageService.extractDataFromLocalStorage();
        app.colorService.updateColors();
        app.sceneService.applyColors();
        app.shotService.updateMarkers();
    }
});

if (app.IS_DEV) {
    window.app = app;
    app.scene.debugLayer.show({
        embedMode: true // Встраивает статистику в окно рендера
    });
}

app.checkIfLoaded = () => {
    if (!app.runtime.loaded) {
        throw "Scene has not been loaded yet";
    }
}

app.sceneService.setUpScene();

window.app = app;