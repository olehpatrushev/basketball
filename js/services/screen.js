import {
    BaseService
} from "./base.js";

export class ScreenService extends BaseService {
    setUpScreens(data = {}) {
        if (!this.app.runtime.loaded) {
            console.warn("Scene has not been loaded yet");
            return;
        }
        
        for (const screenId in data) {
            const screenMesh = this.app.scene.getMeshById(screenId);
            if (screenMesh) {
                screenMesh.material.albedoTexture.updateURL(data[screenId]);
                screenMesh.material.emissiveTexture.updateURL(data[screenId]);
            } else {
                console.warn(`"${screenId}" mesh not found`);
            }
        }
    }

    async setUpMainScreen(data = {
        firstName: "Text1",
        lastName: "Text2",
        number: "Text3",
        stat1: "Text4",
        stat2: "Text5",
        stat3: "Text6",
        backgroundImgUrl: null,
        teamLogoBackgroundImgUrl: null,
        playerImgUrl: null,
        color: null
    }) {
        if (!this.app.runtime.loaded) {
            console.warn("Scene has not been loaded yet");
            return;
        }

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
        ctx.strokeStyle = data.color;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = 10;
        ctx.filter = 'blur(20px)';
        ctx.strokeText(data.lastName || "", 1127, 600);
        ctx.filter = 'none';
        ctx.shadowColor = data.color;
        ctx.shadowBlur = 30;
        ctx.lineWidth = 6;
        ctx.fillText(data.lastName.toUpperCase() || "", 1127, 600);

        // Draw Player Number
        ctx.font = '556px "KenyanCoffeeRg-BoldItalic"';
        ctx.strokeStyle = data.color;
        ctx.lineWidth = 10;
        ctx.filter = 'blur(20px)';
        ctx.strokeText(data.number || "", 647, 576);
        ctx.filter = 'none';
        ctx.lineWidth = 6;
        ctx.strokeText(data.number || "", 647, 576);

        // Draw Stats Titles
        ctx.textAlign = "right"
        ctx.font = '288px "KenyanCoffeeRg-BoldItalic"';
        ctx.strokeStyle = data.color;
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
        tempCtx.fillStyle = data.color; // Outline color
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

        const screenMesh = this.app.scene.getMeshById("screen_1");
        const base64 = canvas.toDataURL();
        screenMesh.material.albedoTexture.updateURL(base64);
        screenMesh.material.emissiveTexture.updateURL(base64);
    }
}