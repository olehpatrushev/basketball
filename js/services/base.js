export class BaseService {
    runtime = null
    scene = null

    constructor(runtime) {
        this.runtime = runtime
    }

    setScene(scene) {
        this.scene = scene
    }
}