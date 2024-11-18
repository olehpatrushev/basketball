import {
    BaseService
} from "./base.js";

export class DataService extends BaseService {
    loadData(gameEventId, type, playerId = false, teamId = false) {
        this.app.checkIfLoaded();

        const url = `${this.app.baseURL}/v1/data/stats/games/${gameEventId}/shots`;
        const data = fetch(url)
            .then((response) => response.json())
            .then((responseData) => {
                let filtredShots;

                if (playerId) {
                    filtredShots = responseData.shots.filter(obj => obj.pid === String(playerId));
                } else if (teamId) {
                    filtredShots = responseData.shots.filter(obj => obj.tid === String(teamId));
                } else {
                    filtredShots = responseData.shots
                }             
                
                filtredShots.sort((a, b) => (a.st === "MAKE" ? 1 : -1));

                let numberOfShots = filtredShots.length;
                let numberOf3s = 0;
                let points = 0;
				let makes = 0;
                filtredShots.every((shot) => {
                    if (shot.st == "MAKE") {
						if (shot.is3) {
							numberOf3s++;
							points = points + 3;
						}
						else{
							points = points + 2;
						}
						makes++;
					}					
                    return true;
                });
                let makesRate = 0;
				let tripleRate = 0;
                if(numberOfShots){
                    makesRate = Math.round(makes / numberOfShots * 100);
				    tripleRate = Math.round(numberOf3s / numberOfShots * 100);
                }
                this.app.stat1 = points.toString();
                this.app.stat2 = makesRate + "%";
                this.app.stat3 = tripleRate + "%";
                
                //this.app.screenService.updateScreens();
                //alert(points + "/" + makesRate  + "/" + tripleRate);
                
                this.app.screenService.setUpMainScreen({
                    firstName: "Text1",
                    lastName: "Text2",
                    number: "Text3",
                    stat1: this.app.stat1,
                    stat2: this.app.stat2,
                    stat3: this.app.stat3,
                    backgroundImgUrl: this.app.extractedData.screensCenter,
                    teamLogoBackgroundImgUrl: this.app.extractedData.logoScreen,
                    playerImgUrl: null,
                    color: null,
                    noImage: this.app.extractedData.screensCenter ? false : true
                })

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