import {
    BaseService
} from "./base.js";

export class SceneService extends BaseService {
    setUpScene() {
        // Create and position a free camera 
        this.app.camera = new BABYLON.ArcRotateCamera("camera1", 10, 10, 10, BABYLON.Vector3(-8.5, 0, 0.8), this.app.scene);

        if (this.app.IS_DEV) {
            this.app.camera.setPosition(new BABYLON.Vector3(13.4, 9.3, 0));
            this.app.camera.setTarget(new BABYLON.Vector3(-9, 0.6, 0));
            this.app.camera.attachControl(this.app.canvas, true);
        }

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.app.scene);
        light.intensity = 0.7;
        //const light2 = new BABYLON.SpotLight( "spotlight_1", new BABYLON.Vector3(0, 30, 0),  new BABYLON.Vector3(0, -1, 0.3), Math.PI, 1, scene );
        //light2.intensity = 2000;

        const markersRoot = new BABYLON.TransformNode("markersRoot", this.app.scene);
        const segmentsRoot = new BABYLON.TransformNode("segmentsRoot", this.app.scene);

        // Load the GLTF model
        BABYLON.SceneLoader.Append("./", "scene.glb" + (this.app.IS_DEV ? "?time=" + (new Date()).getTime() : ""), this.app.scene,
            () => {
                this.app.runtime.loaded = true;

                if (!this.app.IS_DEV) {
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
                    this.app.camera.animations.push(animation);

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
                    this.app.camera.animations.push(targetAnimation);

                    // Run the animation
                    this.app.scene.beginAnimation(this.app.camera, 0, 600, true);
                }

                this.app.scene.getMeshByName('ball1').setEnabled(false);
                this.app.scene.getMeshByName('ball2').setEnabled(false);

                for (let i = 1; i <= 14; i++) {
                    this.app.scene.getMeshByName('segment_' + i).setEnabled(false);
                }

                ((this.app.IS_DEV && !this.app.IS_CHROMAKEY) || this.app.IS_TEST) && this.app.segmentService.setUpSegments({
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

                if (this.app.extractedData && !this.app.IS_CHROMAKEY) {
                    if (this.app.extractedData.type == 'shotMap' && !this.app.extractedData.player) {
                        this.app.dataService.loadData(this.app.extractedData.gameId, "shots", false, this.app.extractedData.teamId);
                    } else if (this.app.extractedData.type != 'shotMap' && !this.app.extractedData.player) {
                        this.app.dataService.loadData(this.app.extractedData.gameId, "zones", false, this.app.extractedData.teamId)
                    }
                    if (this.app.extractedData.player) {
                        if (this.app.extractedData.type == 'shotMap') {
                            this.app.dataService.loadData(this.app.extractedData.gameId, "shots", this.app.extractedData.player.id);
                        } else {
                            this.app.dataService.loadData(this.app.extractedData.gameId, "zones", this.app.extractedData.player.id)
                        }
                    }
                }

                this.app.screenService.updateScreens();
                this.applyColors();

                this.app.startLoop();
            });
    }

    applyColors() {
        this.app.checkIfLoaded();

        this.app.scene.getMeshByName('upper_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor3);
        this.app.scene.getMeshByName('seats').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor1);
        this.app.scene.getMeshByName('blue_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor2);

    }
}