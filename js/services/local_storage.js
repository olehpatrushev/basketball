import {
    BaseService
} from "./base.js";

export class LocalStorageService extends BaseService {    
    extractDataFromLocalStorage() {
        // Получаем данные из localStorage по ключу 'air'
        const airData = JSON.parse(localStorage.getItem('air'));


        if (!airData) {
            console.error('No data found in localStorage with key "air"');
            return null;
        }

        // Initialize an object to store extracted data
        const extractedData = {
            type: airData.type,
            screensTeam: airData.screensTeam,
            gameId: airData.gameId,
            teamId: airData.teamId,
            logoHome: airData.logoHome,
            logoOpponent: airData.logoOpponent,
            screensLeft: airData.screensLeft,
            screensCenter: airData.screensCenter,
            screensRight: airData.screensRight,
            leftTunnel: airData.selectedLeftTunnelSponsorImage,
            rightTunnel: airData.selectedRightTunnelSponsorImage,
            lowerWall: airData.selectedLowerSponsorImage,
            upperWall: airData.selectedUpperSponsorImage,
            center: airData.selectedCenterCourtSponsorImage,
            hoop: airData.selectedHoopStanchionSponsorImage,
            colors: airData.colors,
            player: airData.screensPlayer, 
            logoScreen: null
        };

        
        let background = './tex/background.png';
        if (extractedData.type != 'shotMap') {
            background = './tex/background2.png';
        }
        
        if(airData.colors.length > 0){
            extractedData.colors = airData.colors;
        }

        function getColorByObjectName(data, objectName) {
            const colorData = data.find(item  => item.objectName === objectName);
            let defaultColor = '#1328a9';
            if(objectName == 'SHOT_MISSED' || objectName == 'SHOT_MADE' || objectName == 'SHOT_TRAILER') defaultColor = null;
            return colorData ? colorData.color : defaultColor;
        }   

        //main screen
        let mainScreenSrc = './tex/main_screen_background.jpg';
        if(extractedData.screensCenter) mainScreenSrc = extractedData.screensCenter;

        //left screen
        let leftScreenUrl =  "./tex/black.png";
        if (extractedData.screensLeft) {
            leftScreenUrl = extractedData.screensLeft;
        }
        else if(!extractedData.screensLeft && extractedData.screensRight){
            leftScreenUrl = extractedData.screensRight;
        }
        
        //right screen
        let rightScreenUrl =  "./tex/black.png";
        if (extractedData.screensRight) {
            rightScreenUrl = extractedData.screensRight;
        }
        else if(!extractedData.screensRight && extractedData.screensLeft){
            rightScreenUrl = extractedData.screensLeft;
        }

        //logo
        let logoURL = "./tex/pix.png";
        if(extractedData.screensTeam == 'home' && extractedData.logoHome){
            logoURL = extractedData.logoHome;
        }
        else if(extractedData.screensTeam != 'home' && extractedData.logoOpponent){
            logoURL = extractedData.logoOpponent;
        }

        extractedData.logoScreen = logoURL;

        if (extractedData && extractedData.logoId) {
            logoURL = "https://shottracker.com/pimg/" + extractedData.logoId;
        }

        //left tunnel
        let leftTunnelUrl = logoURL;
        if(extractedData.leftTunnel){
            leftTunnelUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.leftTunnel.sponsorId}&filePath=${extractedData.leftTunnel.graphicPathFilename}`;
            extractedData.leftTunnel = leftTunnelUrl;
        }

        //right tunnel
        let rightTunnelUrl = logoURL;
        if(extractedData.rightTunnel){
            rightTunnelUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.rightTunnel.sponsorId}&filePath=${extractedData.rightTunnel.graphicPathFilename}`;
            extractedData.rightTunnel = rightTunnelUrl;
        }

        //sponsors
        let lowerWallUrl = logoURL;
        if(extractedData.lowerWall) {
            lowerWallUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.lowerWall.sponsorId}&filePath=${extractedData.lowerWall.graphicPathFilename}`;
            extractedData.lowerWall = lowerWallUrl;
        }

        let upperWallUrl = logoURL;
        if(extractedData.upperWall) {
            upperWallUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.upperWall.sponsorId}&filePath=${extractedData.upperWall.graphicPathFilename}`;
            extractedData.upperWall = upperWallUrl;
        }

        let hoopUrl = logoURL;
        if(extractedData.hoop) {
            hoopUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.hoop.sponsorId}&filePath=${extractedData.hoop.graphicPathFilename}`;
            extractedData.hoop = hoopUrl;
        }

        let centerUrl  = logoURL;
        if(extractedData.center) {
            centerUrl = `${this.app.baseURL}/v2/team/public/${extractedData.teamId}/sponsor/graphics/stream?sponsorId=${extractedData.center.sponsorId}&filePath=${extractedData.center.graphicPathFilename}`;
            extractedData.center = centerUrl;
        }

        extractedData.color_lower_wall = getColorByObjectName(extractedData.colors, 'WALL_LOWER');
        extractedData.color_upper_wall = getColorByObjectName(extractedData.colors, 'WALL_UPPER');
        extractedData.color_seats = getColorByObjectName(extractedData.colors, 'SEATS');
        extractedData.color_missed = getColorByObjectName(extractedData.colors, 'SHOT_MISSED');
        extractedData.color_made = getColorByObjectName(extractedData.colors, 'SHOT_MADE');
        extractedData.color_path = getColorByObjectName(extractedData.colors, 'SHOT_TRAILER');
        
        console.log(extractedData);

        return extractedData;
    }
}