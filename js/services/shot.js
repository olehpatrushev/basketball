import {
    BaseService
} from "./base.js";

import {
    newV,
    generateCircle,
    makeTextPlane,
    showAxis
} from "../helpers/geometry.js";

import {
    convertSVGContentToDataUrl,
    convertSVGToDataUrl
} from "../helpers/svg.js";

import {
    getMarkerSVGContent
} from "../contents/marker.js";

export class ShotService extends BaseService {
    process() {
        this.app.checkIfLoaded();

        if (this.app.runtime.shots.length > 0) {
            if (this.app.runtime.currentShotIndex + 1 >= this.app.runtime.shots.length) {
                this.app.runtime.currentShotIndex = 0;
            }

            const shot = this.app.runtime.shots.find((element, index) => {
                if (!element.missed && index >= this.app.runtime.currentShotIndex) {
                    this.app.runtime.currentShotIndex = index;
                    return true;
                }
            });

            if (shot && !shot.missed) {
                if (shot.animationIndex >= shot.curve.getPoints().length) {
                    if (shot.tracer) {
                        this.app.scene.removeMesh(shot.tracer, true);
                        shot.tracer = null;
                    }

                    shot.animationIndex = 0;
                    this.app.runtime.currentShotIndex++;
                } else {
                    shot.animationIndex++;

                    const contour = generateCircle(0.06, 0.06, 6, 'xy');
                    let path = [...shot.curve.getPoints()].splice(0, shot.animationIndex);
                    if (path.length > 1) {
                        if (path.length > 13) {
                            path = path.splice(-13);
                        }

                        if (shot.tracer) {
                            this.app.scene.removeMesh(shot.tracer, true);
                        }

                        shot.tracer = BABYLON.MeshBuilder.ExtrudeShape('ext0', {
                            shape: contour,
                            path: path
                        });

                        shot.tracer.material = new BABYLON.StandardMaterial("trackMat", this.app.scene);
                        let tracerColor = this.app.mainColor;
                        if(this.app.extractedData.color_path) tracerColor = this.app.extractedData.color_path;
                        shot.tracer.material.diffuseColor = BABYLON.Color3.FromHexString(tracerColor);
                        shot.tracer.material.emissiveColor = BABYLON.Color3.FromHexString(tracerColor);

                        shot.tracer.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
                    }
                }
            } else if (!shot) {
                this.app.runtime.currentShotIndex = 0;
            }
        }
    }

    prepareShot(shotData = {}) {
        this.app.checkIfLoaded();

        let shot = {
            animationIndex: 0,
            missed: null,
            curve: null,
            marker: null,
            tracer: null
        };

        if (!this.app.runtime.loaded) {
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

        let markerMaterial = this.getMarkerMaterial(shot.missed);

        const markersRoot = this.app.scene.getNodeById("markersRoot");
        const marker = BABYLON.MeshBuilder.CreatePlane("marker", {
            width: 1,
            height: 1
        }, this.app.scene);

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

    getMarkerMaterial(missed) {
        let markerMaterial;

        if (missed) {
            if (this.app.cacheService.hasItem("markerMaterialMissed")) {
                markerMaterial = this.app.cacheService.getItem("markerMaterialMissed");
            }
        } else {
            if (this.app.cacheService.hasItem("markerMaterialDone")) {
                markerMaterial = this.app.cacheService.getItem("markerMaterialDone");
            }
        }

        if (!markerMaterial) {
            markerMaterial = new BABYLON.StandardMaterial("shotMat")

            let color;

            if (missed) {
                this.app.cacheService.cacheItem("markerMaterialMissed", markerMaterial);
                color = "#ff0000";
                if(this.app.extractedData.color_missed) color = this.app.extractedData.color_missed;
            } else {
                this.app.cacheService.cacheItem("markerMaterialDone", markerMaterial);
                color = this.app.mainColor;
                if(this.app.extractedData.color_made) color = this.app.extractedData.color_made;
            }

            convertSVGContentToDataUrl(getMarkerSVGContent(color)).then(dataUrl => {
                markerMaterial.diffuseTexture = markerMaterial.emissiveTexture = markerMaterial.opacityTexture = new BABYLON.Texture(dataUrl);
            })
        }

        return markerMaterial;
    }

    updateMarkers() {
        if (this.app.cacheService.hasItem("markerMaterialDone")) {
            this.app.cacheService.clearItem("markerMaterialDone");
        }

        this.app.runtime.shots.every((shot) => {
            if (!shot.missed) {
                shot.marker.material = this.getMarkerMaterial(false);
            }
            return true;
        })
    }

    clearShots() {
        this.app.checkIfLoaded();

        this.app.runtime.shots.every((shot) => {
            if (shot.tracer) {
                this.app.scene.removeMesh(shot.tracer, true);
            }

            if (shot.marker) {
                this.app.scene.removeMesh(shot.marker, true);
            }
            return true;
        });

        this.app.runtime.shots = [];
        this.app.runtime.currentShotIndex = 0;
    }
}