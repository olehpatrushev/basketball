import {
    BaseService
} from "./base.js";

import {
    pSBC
} from "../helpers/color.js"

export class ColorService extends BaseService {
    updateColors() {
        if (this.app.IS_CHROMAKEY) {
            this.app.mainColor = '#00FF00';
        } else {
            // Устанавливаем основной цвет из данных, полученных из LocalStorage
            this.app.mainColor = this.app.extractedData && this.app.extractedData.color ? this.app.extractedData.color : '#00f6ff';
        }

        this.app.supportColor1 = pSBC(-0.5, this.app.mainColor, false, true);
        this.app.supportColor2 = pSBC(-0.7, this.app.mainColor, false, true);
        this.app.supportColor3 = pSBC(-0.8, this.app.mainColor, false, true);
    }
}