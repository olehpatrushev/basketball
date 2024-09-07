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
        BABYLON.SceneLoader.Append("./", "scene.gltf" + (this.app.IS_DEV ? "?time=" + (new Date()).getTime() : ""), this.app.scene,
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

                //IS_DEV && showAxis(100, scene);

                this.app.IS_DEV && !this.app.IS_CHROMAKEY && this.app.segmentService.setUpSegments({
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

                this.app.scene.getMeshByName('upper_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor3);
                this.app.scene.getMeshByName('seats').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor1);
                this.app.scene.getMeshByName('blue_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor2);

                this.app.screenService.setUpScreens({
                    "screen_1": "./tex/main_screen_background.jpg"
                }, this.app.scene)

                let sponsorLogo = "./tex/GatoradeG.png";
                if (this.app.extractedData && this.app.extractedData.sponsorZones && this.app.extractedData.sponsorZones.sponsorZone1 && this.app.extractedData.sponsorZones.sponsorZone1.id) {
                    sponsorLogo = `${this.app.baseURL}/v2/team/public/${this.app.extractedData.teamId}/sponsor/graphics/stream?sponsorId=${this.app.extractedData.sponsorZones.sponsorZone1.sponsorId}&filePath=${this.app.extractedData.sponsorZones.sponsorZone1.graphicPathFilename}`;
                }

                let logoURL = "./tex/Creighton_Bluejays_logo_svg.png";
                if (this.app.extractedData && this.app.extractedData.logoId) {
                    logoURL = "https://shottracker.com/pimg/" + this.app.extractedData.logoId;
                }

                if (this.app.IS_CHROMAKEY) {
                    sponsorLogo = './tex/blue.png';
                    logoURL = './tex/red.png';
                }

                const sponsorMaterial = this.app.scene.getMaterialByName('sponsor');
                sponsorMaterial.albedoTexture.updateURL(sponsorLogo);
                const logoMaterial = this.app.scene.getMaterialByName('logo');
                logoMaterial.albedoTexture.updateURL(logoURL);

                if (this.app.extractedData && !this.app.IS_CHROMAKEY) {
                    if (this.app.extractedData.type == 'shotMap' && !this.app.extractedData.player) {
                        this.app.dataService.loadData(this.app.extractedData.gameId, "shots", false, this.app.extractedData.teamId);
                    } else if (this.app.extractedData.type != 'shotMap' && !this.app.extractedData.player) {
                        this.app.dataService.loadData(this.app.extractedData.gameId, "zones", false, this.app.extractedData.teamId)
                    }
                    if (this.app.extractedData.player) {
                        this.app.screenService.setUpMainScreen({
                            firstName: this.app.extractedData.player.first_name,
                            lastName: this.app.extractedData.player.last_name,
                            number: this.app.extractedData.player.jersey_number_str,
                            stat1: "50", // Пример статов, можно заменить на актуальные данные
                            stat2: "50%",
                            stat3: "50%",
                            backgroundImgUrl: "./tex/main_screen_background.jpg",
                            teamLogoBackgroundImgUrl: logoURL,
                            playerImgUrl: "https://shottracker.com/pimg/" + this.app.extractedData.player.image_light,
                            color: this.app.mainColor
                        });
                        if (this.app.extractedData.type == 'shotMap') {
                            this.app.dataService.loadData(this.app.extractedData.gameId, "shots", this.app.extractedData.player.id);
                        } else {
                            this.app.dataService.loadData(this.app.extractedData.gameId, "zones", this.app.extractedData.player.id)
                        }
                    }
                    if (this.app.extractedData.sponsorZones && this.app.extractedData.sponsorZones.sponsorZone2 && this.app.extractedData.sponsorZones.sponsorZone2.id) {
                        let smallScreenURL = `${this.app.baseURL}/v2/team/public/${this.app.extractedData.teamId}/sponsor/graphics/stream?sponsorId=${this.app.extractedData.sponsorZones.sponsorZone2.sponsorId}&filePath=${this.app.extractedData.sponsorZones.sponsorZone2.graphicPathFilename}`;
                        this.app.screenService.setUpScreens({
                            "screen_2": smallScreenURL
                        }, this.app.scene)
                        this.app.screenService.setUpScreens({
                            "screen_3": smallScreenURL
                        }, this.app.scene)
                    }
                    if (this.app.extractedData.sponsorZones && this.app.extractedData.sponsorZones.sponsorZone3 && this.app.extractedData.sponsorZones.sponsorZone3.id) {
                        let bigScreenURL = `${this.app.baseURL}/v2/team/public/${this.app.extractedData.teamId}/sponsor/graphics/stream?sponsorId=${this.app.extractedData.sponsorZones.sponsorZone3.sponsorId}&filePath=${this.app.extractedData.sponsorZones.sponsorZone3.graphicPathFilename}`;
                        this.app.screenService.setUpScreens({
                            "screen_4": bigScreenURL
                        }, this.app.scene)
                        this.app.screenService.setUpScreens({
                            "screen_5": bigScreenURL
                        }, this.app.scene)
                    }
                }

                if (this.app.IS_CHROMAKEY) {
                    let redpix = './tex/redpix.png';
                    this.app.screenService.setUpScreens({
                        "screen_1": redpix
                    }, this.app.scene)
                    this.app.screenService.setUpScreens({
                        "screen_2": redpix
                    }, this.app.scene);
                    this.app.screenService.setUpScreens({
                        "screen_3": redpix
                    }, this.app.scene);
                    this.app.screenService.setUpScreens({
                        "screen_4": redpix
                    }, this.app.scene);
                    this.app.screenService.setUpScreens({
                        "screen_5": redpix
                    }, this.app.scene);
                    //loadData("b0edea70-22e1-11eb-b93a-02420c129761", "shots");
                }

                this.app.startLoop();
            });
    }
}