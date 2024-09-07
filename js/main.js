import {
    getMarkerSVGContent
} from "./contents/marker.js";

import {
    convertSVGContentToDataUrl,
    convertSVGToDataUrl
} from "./helpers/svg.js"

import {
    cacheItem,
    getItem,
    hasItem
} from "./helpers/cache.js"

import {
    newV,
    generateCircle,
    makeTextPlane,
    showAxis
} from "./helpers/geometry.js"

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

const baseURL = '//shotv1.4natic.online';
//const baseURL = '//shotv1.stacqan.com';


// Get the canvas element
const canvas = document.getElementById('renderCanvas');

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


let runtime = {
    shots: [],
    loaded: false,
    currentShotIndex: 0
};

const screenService = new ScreenService(runtime);
const segmentService = new SegmentService(runtime);
const localStorageService = new LocalStorageService(runtime);

const extractedData = window.extractedData = localStorageService.extractDataFromLocalStorage();

let IS_CHROMAKEY = false;
if (urlParams.has('IS_CHROMAKEY')) {
    IS_CHROMAKEY = true;
}

// Устанавливаем основной цвет из данных, полученных из LocalStorage
let mainColor = extractedData && extractedData.color ? extractedData.color : '#00f6ff';

if (IS_CHROMAKEY) {
    mainColor = '#00FF00';
}

const supportColor1 = pSBC(-0.5, mainColor, false, true);
const supportColor2 = pSBC(-0.7, mainColor, false, true);
const supportColor3 = pSBC(-0.8, mainColor, false, true);

// Generate the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

let camera; // Declare camera variable in global scope
let IS_DEV = false;

if (urlParams.has('IS_DEV')) {
    IS_DEV = true;
}

// Create the scene
const scene = (() => {
    // Create a basic Babylon Scene object
    const scene = new BABYLON.Scene(engine);

    screenService.setScene(scene);
    segmentService.setScene(scene);
    localStorageService.setScene(scene);

    // Create and position a free camera
    camera = new BABYLON.ArcRotateCamera("camera1", 10, 10, 10, BABYLON.Vector3(-8.5, 0, 0.8), scene);

    if (IS_DEV) {
        camera.setPosition(new BABYLON.Vector3(13.4, 9.3, 0));
        camera.setTarget(new BABYLON.Vector3(-9, 0.6, 0));
        camera.attachControl(canvas, true);
    }

    // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    //const light2 = new BABYLON.SpotLight( "spotlight_1", new BABYLON.Vector3(0, 30, 0),  new BABYLON.Vector3(0, -1, 0.3), Math.PI, 1, scene );
    //light2.intensity = 2000;

    const markersRoot = new BABYLON.TransformNode("markersRoot", scene);
    const segmentsRoot = new BABYLON.TransformNode("segmentsRoot", scene);

    // Load the GLTF model
    BABYLON.SceneLoader.Append("./", "scene.gltf" + (IS_DEV ? "?time=" + (new Date()).getTime() : ""), scene,
        function () {
            runtime.loaded = true;

            if (!IS_DEV) {
                // Do something with the scene after loading
                const animation = new BABYLON.Animation("cameraAnimation", "position", 30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

                // Animation keys
                const keys = [];
                keys.push({
                    frame: 0,
                    //value: new BABYLON.Vector3(1.9, 3.6, 9.8) // Starting position
                    value: new BABYLON.Vector3(5, 3.5, 10) // Starting position
                });
                keys.push({
                    frame: 300,
                    //value: new BABYLON.Vector3(1.6, 10.3, 2) // Ending position
                    value: new BABYLON.Vector3(10, 3.5, -10) // Ending position
                });
                keys.push({
                    frame: 600,
                    //value: new BABYLON.Vector3(1.6, 10.3, 2) // Ending position
                    value: new BABYLON.Vector3(5, 3.5, 10) // Starting position
                });

                animation.setKeys(keys);

                // Attach the animation to the camera
                camera.animations.push(animation);

                // Create an animation for the camera's target
                const targetAnimation = new BABYLON.Animation("cameraTargetAnimation", "target", 30,
                    BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

                const targetKeys = [];
                targetKeys.push({
                    frame: 0,
                    value: new BABYLON.Vector3(-8.5, 0, 0.8) // Starting target
                });
                targetKeys.push({
                    frame: 300,
                    value: new BABYLON.Vector3(-7, 0, 0.8) // Ending target
                });
                targetKeys.push({
                    frame: 600,
                    value: new BABYLON.Vector3(-8.5, 0, 0.8) // Starting target
                });


                targetAnimation.setKeys(targetKeys);

                // Attach the animation to the camera
                camera.animations.push(targetAnimation);

                // Run the animation
                scene.beginAnimation(camera, 0, 600, true);
            }

            scene.getMeshByName('ball1').setEnabled(false);
            scene.getMeshByName('ball2').setEnabled(false);

            for (let i = 1; i <= 14; i++) {
                scene.getMeshByName('segment_' + i).setEnabled(false);
            }

            //IS_DEV && showAxis(100, scene);

            IS_DEV && !IS_CHROMAKEY && segmentService.setUpSegments({
                "segment_1": {
                    "missed": 10,
                    "made": 20
                },
                "segment_2": {
                    "missed": 0,
                    "made": 10
                },
                "segment_3": {
                    "missed": 10,
                    "made": 10
                }
            })

            scene.getMeshByName('upper_wall').material.albedoColor = BABYLON.Color3.FromHexString(supportColor3);
            scene.getMeshByName('seats').material.albedoColor = BABYLON.Color3.FromHexString(supportColor1);
            scene.getMeshByName('blue_wall').material.albedoColor = BABYLON.Color3.FromHexString(supportColor2);

            screenService.setUpScreens({
                "screen_1": "./tex/main_screen_background.jpg"
            }, scene)

            let sponsorLogo = "./tex/GatoradeG.png";
            if (extractedData && extractedData.sponsorZones && extractedData.sponsorZones.sponsorZone1 && extractedData.sponsorZones.sponsorZone1.id) {
                sponsorLogo = `${baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.sponsorZones.sponsorZone1.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone1.graphicPathFilename}`;
            }

            let logoURL = "./tex/Creighton_Bluejays_logo_svg.png";
            if (extractedData && extractedData.logoId) {
                logoURL = "https://shottracker.com/pimg/" + extractedData.logoId;
            }

            if (IS_CHROMAKEY) {
                sponsorLogo = './tex/blue.png';
                logoURL = './tex/red.png';
            }

            const sponsorMaterial = scene.getMaterialByName('sponsor');
            sponsorMaterial.albedoTexture.updateURL(sponsorLogo);
            const logoMaterial = scene.getMaterialByName('logo');
            logoMaterial.albedoTexture.updateURL(logoURL);

            if (extractedData && !IS_CHROMAKEY) {
                if (extractedData.type == 'shotMap' && !extractedData.player) {
                    loadData(extractedData.gameId, "shots", false, extractedData.teamId);
                } else if (extractedData.type != 'shotMap' && !extractedData.player) {
                    loadData(extractedData.gameId, "zones", false, extractedData.teamId)
                }
                if (extractedData.player) {
                    screenService.setUpMainScreen({
                        firstName: extractedData.player.first_name,
                        lastName: extractedData.player.last_name,
                        number: extractedData.player.jersey_number_str,
                        stat1: "50", // Пример статов, можно заменить на актуальные данные
                        stat2: "50%",
                        stat3: "50%",
                        backgroundImgUrl: "./tex/main_screen_background.jpg",
                        teamLogoBackgroundImgUrl: logoURL,
                        playerImgUrl: "https://shottracker.com/pimg/" + extractedData.player.image_light,
                        color: mainColor
                    });
                    if (extractedData.type == 'shotMap') {
                        loadData(extractedData.gameId, "shots", extractedData.player.id);
                    } else {
                        loadData(extractedData.gameId, "zones", extractedData.player.id)
                    }
                }
                if (extractedData.sponsorZones && extractedData.sponsorZones.sponsorZone2 && extractedData.sponsorZones.sponsorZone2.id) {
                    let smallScreenURL = `${baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.sponsorZones.sponsorZone2.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone2.graphicPathFilename}`;
                    screenService.setUpScreens({
                        "screen_2": smallScreenURL
                    }, scene)
                    screenService.setUpScreens({
                        "screen_3": smallScreenURL
                    }, scene)
                }
                if (extractedData.sponsorZones && extractedData.sponsorZones.sponsorZone3 && extractedData.sponsorZones.sponsorZone3.id) {
                    let bigScreenURL = `${baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.sponsorZones.sponsorZone3.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone3.graphicPathFilename}`;
                    screenService.setUpScreens({
                        "screen_4": bigScreenURL
                    }, scene)
                    screenService.setUpScreens({
                        "screen_5": bigScreenURL
                    }, scene)
                }
            }

            if (IS_CHROMAKEY) {
                let redpix = './tex/redpix.png';
                screenService.setUpScreens({
                    "screen_1": redpix
                }, scene)
                screenService.setUpScreens({
                    "screen_2": redpix
                }, scene);
                screenService.setUpScreens({
                    "screen_3": redpix
                }, scene);
                screenService.setUpScreens({
                    "screen_4": redpix
                }, scene);
                screenService.setUpScreens({
                    "screen_5": redpix
                }, scene);
                //loadData("b0edea70-22e1-11eb-b93a-02420c129761", "shots");
            }

            startLoop();
        });

    return scene;
})();

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
    console.log("Camera Position:", camera.position);
    console.log("Camera Alpha:", camera.alpha);
    console.log("Camera Beta:", camera.beta);
    console.log("Camera Radius:", camera.radius);
    console.log("Camera Target:", camera.target);
};

// Register a render loop to repeatedly render the scene
const startLoop = () => {
    engine.runRenderLoop(function () {
        process();

        scene.render();

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
        logCameraParameters(scene.activeCamera);
    }
});

const process = function () {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    if (runtime.shots.length > 0) {
        if (runtime.currentShotIndex + 1 >= runtime.shots.length) {
            runtime.currentShotIndex = 0;
        }

        const shot = runtime.shots.find((element, index) => {
            if (!element.missed && index >= runtime.currentShotIndex) {
                runtime.currentShotIndex = index;
                return true;
            }
        });

        if (shot && !shot.missed) {
            if (shot.animationIndex >= shot.curve.getPoints().length) {
                if (shot.tracer) {
                    scene.removeMesh(shot.tracer, true);
                    shot.tracer = null;
                }

                shot.animationIndex = 0;
                runtime.currentShotIndex++;
            } else {
                shot.animationIndex++;

                const contour = generateCircle(0.06, 0.06, 6, 'xy');
                let path = [...shot.curve.getPoints()].splice(0, shot.animationIndex);
                if (path.length > 1) {
                    if (path.length > 13) {
                        path = path.splice(-13);
                    }

                    if (shot.tracer) {
                        scene.removeMesh(shot.tracer, true);
                    }

                    shot.tracer = BABYLON.MeshBuilder.ExtrudeShape('ext0', {
                        shape: contour,
                        path: path
                    });

                    shot.tracer.material = new BABYLON.StandardMaterial("trackMat", scene);
                    shot.tracer.material.diffuseColor = BABYLON.Color3.FromHexString(mainColor);
                    shot.tracer.material.emissiveColor = BABYLON.Color3.FromHexString(mainColor);

                    shot.tracer.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                }
            }
        } else if (!shot) {
            runtime.currentShotIndex = 0;
        }
    }
}

const prepareShot = function (shotData = {}) {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    let shot = {
        animationIndex: 0,
        missed: null,
        curve: null,
        marker: null,
        tracer: null
    };

    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    let x = parseInt(shotData.hsx);
    let y = parseInt(shotData.hsy);

    /*
    if (isNaN(x) || x <= -7620 || x >= 7620) {
        console.warn(`"x" must be integer between -7620 and 7620, ${x} given`);
        return;
    }
    if (isNaN(y) || y <= -1220 || y >= 14210) {
        console.warn(`"y" must be integer between -1220 and 14210, ${y} given`);
        return;
    }
    */

    x = x / 1080;
    y = (y + 1600) / 1080;

    y = 13.374 - y;

    shot.missed = shotData.st == "MISS";

    let markerMaterial;

    if (shot.missed) {
        if (hasItem("markerMaterialMissed")) {
            markerMaterial = getItem("markerMaterialMissed");
        }
    } else {
        if (hasItem("markerMaterialDone")) {
            markerMaterial = getItem("markerMaterialDone");
        }
    }

    if (!markerMaterial) {
        markerMaterial = new BABYLON.StandardMaterial("shotMat")

        let color;

        if (shot.missed) {
            cacheItem("markerMaterialMissed", markerMaterial);
            color = "#ff0000";
        } else {
            cacheItem("markerMaterialDone", markerMaterial);
            color = mainColor;
        }

        convertSVGContentToDataUrl(getMarkerSVGContent(color)).then(dataUrl => {
            markerMaterial.diffuseTexture = markerMaterial.emissiveTexture = markerMaterial.opacityTexture = new BABYLON.Texture(dataUrl);
        })
    }

    const markersRoot = scene.getNodeById("markersRoot");
    const marker = BABYLON.MeshBuilder.CreatePlane("marker", {
        width: 1,
        height: 1
    }, scene);

    marker.material = markerMaterial;
    marker.position.set(-y, 0.13, -x);
    marker.setParent(markersRoot);
    marker.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

    shot.marker = marker;

    const position = newV(y, 0.13, x);
    const distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y - 12.1, 2));
    const destination = new BABYLON.Vector3(12.1, 3.13, 0)
    const point1 = destination.clone().subtract(position)
    point1.y = 0;
    point1.normalize()
    point1.scaleInPlace(distance * .3)
    const control = destination.clone().subtract(point1)
    control.y = Math.max(6, distance / 3);

    shot.curve = BABYLON.Curve3.CreateCatmullRomSpline(
                [
                    position,
                    control,
                    destination
                ],
        Math.max(parseInt(distance), 13),
        false
    );

    return shot;
}

const clearShots = function () {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    runtime.shots.every((shot) => {
        if (shot.tracer) {
            scene.removeMesh(shot.tracer, true);
        }

        if (shot.marker) {
            scene.removeMesh(shot.marker, true);
        }
        return true;
    });

    runtime.shots = [];
    runtime.currentShotIndex = 0;
}

const loadData = function (gameEventId, type, playerId = false, teamId = false) {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    const url = `${baseURL}/v1/data/stats/games/${gameEventId}/shots`;
    const data = fetch(url)
        .then((response) => response.json())
        .then((responseData) => {

            let filtredShots;
            if (playerId) {
                filtredShots = responseData.shots.filter(obj => obj.pid === String(playerId));
            } else {
                filtredShots = responseData.shots.filter(obj => obj.tid === String(teamId));
            }

            if (type == 'shots') {
                segmentService.setUpSegments();
                clearShots();
                runtime.shots = filtredShots.map((shot) => prepareShot(shot));
            } else if (type == 'zones') {
                let data = {};

                filtredShots.every((shot) => {
                    if (!("segment_" + shot.z in data)) {
                        data["segment_" + shot.z] = {
                            missed: 0,
                            made: 0
                        };
                    }
                    if (shot.st == "MISS") {
                        data["segment_" + shot.z].missed++;
                    }
                    data["segment_" + shot.z].made++;
                    return true;
                });

                segmentService.setUpSegments(data);
            }
        });
}