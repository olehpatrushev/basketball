import {
    BaseService
} from "./base.js";

export class DataService extends BaseService {
    loadData(gameEventId, type, playerId = false, teamId = false) {
        if (!this.app.runtime.loaded) {
            console.warn("Scene has not been loaded yet");
            return;
        }

        const url = `${this.app.baseURL}/v1/data/stats/games/${gameEventId}/shots`;
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
                    this.app.segmentService.setUpSegments();
                    this.app.shotService.clearShots();
                    this.app.runtime.shots = filtredShots.map((shot) => this.app.shotService.prepareShot(shot));
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

                    this.app.segmentService.setUpSegments(data);
                }
            });
    }
}