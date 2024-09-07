import {
    BaseService
} from "./base.js";

import {
    newV,
    generateCircle,
    makeTextPlane,
    showAxis
} from "../helpers/geometry.js";

export class SegmentService extends BaseService {
    setUpSegments(data = {}) {
        if (!this.app.runtime.loaded) {
            console.warn("Scene has not been loaded yet");
            return;
        }

        for (let i = 1; i <= 14; i++) {
            this.app.scene.getMeshByName('segment_' + i).setEnabled(false);
        }

        const segmentsRoot = this.app.scene.getNodeById("segmentsRoot");
        segmentsRoot.getChildren().forEach(child => this.app.scene.removeMesh(child));

        for (const segmentName in data) {
            const segmentData = data[segmentName];
            const segmentMesh = this.app.scene.getMeshByName(segmentName);
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
                const scoreText = makeTextPlane(`${segmentData.made - segmentData.missed}/${segmentData.made}`, "white", this.app.scene);
                scoreText.setParent(segmentsRoot);
                scoreText.position.copyFrom(segmentMesh.position);
                scoreText.position.y = 1.3;
                scoreText.position.x *= -1;
                scoreText.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.LOCAL);
            }
        }
    }
}