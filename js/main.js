import {
    getMarkerSVGContent
} from "./marker.js";

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
    extractDataFromLocalStorage
} from "./local_storage.js"

import {
    newV,
    generateCircle,
    makeTextPlane,
    showAxis
} from "./helpers/geometry.js"

import {
    pSBC
} from "./helpers/color.js"

// Get the canvas element
const canvas = document.getElementById('renderCanvas');

// Получаем данные из LocalStorage
const extractedData = extractDataFromLocalStorage();
const urlParams = new URLSearchParams(window.location.search);

let IS_CHROMAKEY = false;
if (urlParams.has('IS_CHROMAKEY')) {
    IS_CHROMAKEY = true;
}

// Устанавливаем основной цвет из данных, полученных из LocalStorage
let mainColor;

if (IS_CHROMAKEY) {
    mainColor = '#00FF00';
} else {
    mainColor = extractedData && extractedData.color ? extractedData.color : '#00f6ff'
}

const supportColor1 = pSBC(-0.4, mainColor, false, true);
const supportColor2 = pSBC(-0.7, mainColor, false, true);

// Generate the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

let camera; // Declare camera variable in global scope
let IS_DEV = false;

let runtime = {
    shots: [],
    loaded: false,
    currentShotIndex: 0
};

if (urlParams.has('IS_DEV')) {
    IS_DEV = true;
}

// Create the scene
const scene = (() => {
    // Create a basic Babylon Scene object
    const scene = new BABYLON.Scene(engine);

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

            IS_DEV && !IS_CHROMAKEY && setUpSegments({
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

            scene.getMeshByName('upper_wall').material.albedoColor = BABYLON.Color3.FromHexString(supportColor2);
            scene.getMeshByName('seats').material.albedoColor = BABYLON.Color3.FromHexString(supportColor1);
            scene.getMeshByName('blue_wall').material.albedoColor = BABYLON.Color3.FromHexString(supportColor2);

            setUpScreens({
                "screen_1": "./tex/main_screen_background.jpg"
            })

            let sponsorLogo = "./tex/GatoradeG.png";
            if (extractedData && extractedData.sponsorZones.sponsorZone1.id) {
                sponsorLogo = `https://3d.stacqan.com/img.php?teamId=${extractedData.teamId}&sponsorId=${extractedData.sponsorZones.sponsorZone1.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone1.graphicPathFilename}`;
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
                if (extractedData.type == 'shotMap') {
                    loadData(extractedData.gameId, "shots");
                } else {
                    loadData(extractedData.gameId, "zones")
                }

                if (extractedData.player) {
                    setUpMainScreen({
                        firstName: extractedData.player.first_name,
                        lastName: extractedData.player.last_name,
                        number: extractedData.player.jersey_number_str,
                        stat1: "50", // Пример статов, можно заменить на актуальные данные
                        stat2: "50%",
                        stat3: "50%",
                        backgroundImgUrl: "./tex/main_screen_background.jpg",
                        teamLogoBackgroundImgUrl: logoURL,
                        playerImgUrl: "https://shottracker.com/pimg/" + extractedData.player.image_light
                    });
                }
                if (extractedData.sponsorZones.sponsorZone2.id) {
                    let screen2url = `https://3d.stacqan.com/img.php?teamId=${extractedData.teamId}&sponsorId=${extractedData.sponsorZones.sponsorZone2.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone2.graphicPathFilename}`;
                    setUpScreens({
                        "screen_2": screen2url
                    })
                }
                if (extractedData.sponsorZones.sponsorZone3.id) {
                    let screen3url = `https://3d.stacqan.com/img.php?teamId=${extractedData.teamId}&sponsorId=${extractedData.sponsorZones.sponsorZone3.sponsorId}&filePath=${extractedData.sponsorZones.sponsorZone3.graphicPathFilename}`;
                    setUpScreens({
                        "screen_4": screen3url
                    })
                    setUpScreens({
                        "screen_5": screen3url
                    })
                }
            }

            if (IS_CHROMAKEY) {
                let redpix = './tex/redpix.png';
                setUpScreens({
                    "screen_1": redpix
                })
                setUpScreens({
                    "screen_2": redpix
                });
                setUpScreens({
                    "screen_3": redpix
                });
                setUpScreens({
                    "screen_4": redpix
                });
                setUpScreens({
                    "screen_5": redpix
                });
                //loadData("b0edea70-22e1-11eb-b93a-02420c129761", "shots");
            }

            startLoop();
        });

    return scene;
})();

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

const setUpSegments = function (data = {}) {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    for (let i = 1; i <= 14; i++) {
        scene.getMeshByName('segment_' + i).setEnabled(false);
    }

    const segmentsRoot = scene.getNodeById("segmentsRoot");
    segmentsRoot.getChildren().forEach(child => scene.removeMesh(child));

    for (const segmentName in data) {
        const segmentData = data[segmentName];
        const segmentMesh = scene.getMeshByName(segmentName);
        const stats = (segmentData.made - segmentData.missed) / segmentData.made;
        if (segmentData.made == 0) {
            segmentMesh.setEnabled(false);
        } else {
            segmentMesh.setEnabled(true);
            segmentMesh.position.y = stats * 0.5 - 0.25;
            if (stats < 0.5) {
                segmentMesh.material.albedoColor.set(1, 0, 0);
            } else {
                segmentMesh.material.albedoColor.set(0, 0, 1);
            }
            const scoreText = makeTextPlane(`${segmentData.made - segmentData.missed}/${segmentData.made}`, "white", scene);
            scoreText.setParent(segmentsRoot);
            scoreText.position.copyFrom(segmentMesh.position);
            scoreText.position.y = 1.3;
            scoreText.position.x *= -1;
            scoreText.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.LOCAL);
        }
    }
}

const setUpScreens = function (data = {}) {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    for (const screenId in data) {
        const screenMesh = scene.getMeshById(screenId);
        if (screenMesh) {
            screenMesh.material.albedoTexture.updateURL(data[screenId]);
            screenMesh.material.emissiveTexture.updateURL(data[screenId]);
        } else {
            console.warn(`"${screenId}" mesh not found`);
        }
    }
}

const setUpMainScreen = async function (data = {
    firstName: "Text1",
    lastName: "Text2",
    number: "Text3",
    stat1: "Text4",
    stat2: "Text5",
    stat3: "Text6",
    backgroundImgUrl: null,
    teamLogoBackgroundImgUrl: null,
    playerImgUrl: null
}) {
    const font1 = new FontFace("KenyanCoffeeRg-BoldItalic", "url('./fonts/kenyan_coffee_bd_it-webfont.woff2') format('woff2'), url('./fonts/kenyan_coffee_bd_it-webfont.woff') format('woff')");
    const font2 = new FontFace("KenyanCoffeeRg-Bold", "url('./fonts/kenyan_coffee_bd-webfont.woff2') format('woff2'), url('./fonts/kenyan_coffee_bd-webfont.woff') format('woff')");

    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Draw Background
    const backgroundImg = new Image();
    backgroundImg.crossOrigin = "anonymous";
    backgroundImg.src = data.backgroundImgUrl || './tex/main_screen_background.jpg';
    await backgroundImg.decode();
    ctx.drawImage(backgroundImg, 0, 0, 3840, 1080);
    // Draw Player Background
    const teamLogoBgImg = new Image();
    teamLogoBgImg.crossOrigin = "anonymous";
    teamLogoBgImg.src = data.teamLogoBackgroundImgUrl || './tex/main_screen_teamlogo_background.png';
    await teamLogoBgImg.decode();
    ctx.globalAlpha = 0.59;
    ctx.drawImage(teamLogoBgImg, 1153, 432, 656, 659);
    ctx.globalAlpha = 1.0;

    await font1.load();
    document.fonts.add(font1);

    // Draw First Name
    ctx.font = '257px "KenyanCoffeeRg-BoldItalic"';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(2,11,57,0.33)";
    ctx.shadowOffsetX = 27;
    ctx.shadowOffsetY = 27;
    ctx.shadowBlur = 0;
    ctx.fillText(data.firstName.toUpperCase() || "", 1180, 336);

    // Draw Last Name
    ctx.font = '309px "KenyanCoffeeRg-BoldItalic"';
    ctx.strokeStyle = mainColor;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 10;
    ctx.filter = 'blur(20px)';
    ctx.strokeText(data.lastName || "", 1127, 600);
    ctx.filter = 'none';
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = 30;
    ctx.lineWidth = 6;
    ctx.strokeText(data.lastName.toUpperCase() || "", 1127, 600);

    // Draw Player Number
    ctx.font = '556px "KenyanCoffeeRg-BoldItalic"';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 10;
    ctx.filter = 'blur(20px)';
    ctx.strokeText(data.number || "", 647, 576);
    ctx.filter = 'none';
    ctx.lineWidth = 6;
    ctx.strokeText(data.number || "", 647, 576);

    // Draw Stats Titles
    ctx.textAlign = "right"
    ctx.font = '288px "KenyanCoffeeRg-BoldItalic"';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 10;
    ctx.filter = 'blur(20px)';
    ctx.strokeText("POINTS", 3000, 380);
    ctx.strokeText("FG%", 3000, 676);
    ctx.strokeText("3 PT FG%", 3000, 959);
    ctx.filter = 'none';
    ctx.lineWidth = 6;
    ctx.strokeText("POINTS", 3000, 380);
    ctx.strokeText("FG%", 3000, 676);
    ctx.strokeText("3 PT FG%", 3000, 959);
    ctx.textAlign = "left"

    await font2.load();
    document.fonts.add(font2);

    // Draw Stats
    ctx.font = '288px "KenyanCoffeeRg-Bold"';
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(2,11,57,0.33)";
    ctx.shadowOffsetX = 27;
    ctx.shadowOffsetY = 27;
    ctx.shadowBlur = 0;
    ctx.fillText(data.stat1 || "", 3100, 380);
    ctx.fillText(data.stat2 || "", 3100, 676);
    ctx.fillText(data.stat3 || "", 3100, 959);

    // Draw Player Image
    const playerImg = new Image();
    playerImg.crossOrigin = "anonymous";
    playerImg.src = data.playerImgUrl || './tex/main_screen_playerimage.png';
    await playerImg.decode();
    const outlineSize = 10; // Outline size
    const x = 50; // X position of the image
    const y = 100; // Y position of the image
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;

    // Creating a temporary canvas for the outline
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = playerImg.width + 2 * outlineSize;
    tempCanvas.height = playerImg.height + 2 * outlineSize;

    // Drawing the outline on the temporary canvas
    tempCtx.drawImage(playerImg, outlineSize, outlineSize);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = mainColor; // Outline color
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Drawing the outline on the main canvas
    for (let dx = -outlineSize; dx <= outlineSize; dx++) {
        for (let dy = -outlineSize; dy <= outlineSize; dy++) {
            if (dx * dx + dy * dy <= outlineSize * outlineSize) {
                ctx.drawImage(tempCanvas, x + dx, y + dy);
            }
        }
    }

    // Finally, drawing the image itself on top of the outline
    ctx.drawImage(playerImg, x + outlineSize, y + outlineSize, 1215, 1008);

    const screenMesh = scene.getMeshById("screen_1");
    const base64 = canvas.toDataURL();
    screenMesh.material.albedoTexture.updateURL(base64);
    screenMesh.material.emissiveTexture.updateURL(base64);
}

const loadData = function (gameEventId, type) {
    if (!runtime.loaded) {
        console.warn("Scene has not been loaded yet");
        return;
    }

    const url = `//shotv1.4natic.online/v1/data/stats/games/${gameEventId}/shots`;
    const data = fetch(url)
        .then((response) => response.json())
        .then((responseData) => {
            if (type == 'shots') {
                setUpSegments();
                clearShots();
                runtime.shots = responseData.shots.map((shot) => prepareShot(shot))
            } else if (type == 'zones') {
                let data = {};

                responseData.shots.every((shot) => {
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

                setUpSegments(data);
            }
        });
}

window.loadData = loadData