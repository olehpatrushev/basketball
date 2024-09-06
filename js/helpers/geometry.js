export const generateCircle = function (r1 = 0.5, r2 = 0.5, q = 12, plane = 'xy') {
    var p = [];
    let a = 2 * Math.PI / q; // arc of each section
    let b = 3 * a / 2; //offset
    for (let i = 0; i < q; i++) {
        let v;
        if (plane == 'xy') {
            v = newV(r1 * Math.cos(i * a), r2 * Math.sin(i * a), 0)
        } else if (plane == 'xz') {
            v = newV(r1 * Math.cos(i * a + b), 0, r2 * Math.sin(i * a + b))
        } else {
            console.warn('plane is ' + plane)
        }
        p.push(vround(v, 3));
    }
    p.push(p[0]);
    return p;
}

export const newV = function (x = 0, y = 0, z = 0) {
    return new BABYLON.Vector3(x, y, z);
}

const dround = function (f, d) {
    d = Math.round(d);
    if (d < -15 || d > 15) {
        return f;
    }
    if (d == 0) {
        return Math.round(f);
    }
    let s = Math.pow(10, d);
    let ff = s * f;
    return Math.round(ff) / s;
}

const vround = function (v, d) {
    let va = [];
    v.toArray(va);
    va.forEach((e, ndx) => {
        va[ndx] = dround(va[ndx], d);
    })
    return v.fromArray(va);
}


export const makeTextPlane = function (text, color, scene) {
    const dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", {
        width: text.length * 20,
        height: 30
    }, scene, true);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 0, 30, "bold 36px monospace", color, "transparent", true, true);
    const plane = BABYLON.MeshBuilder.CreatePlane("TextPlane", {
        width: text.length * 0.25,
        height: 0.5
    }, scene);
    plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
    plane.material.backFaceCulling = false;
    plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
    plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);;
    plane.material.diffuseTexture = dynamicTexture;
    return plane;
};

export const showAxis = function (size, scene) {
    const axisX = BABYLON.Mesh.CreateLines("axisX", [
                BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
                new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
            ], scene);
    axisX.color = new BABYLON.Color3(1, 0, 0);
    const axisY = BABYLON.Mesh.CreateLines("axisY", [
                BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
                new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
            ], scene);
    axisY.color = new BABYLON.Color3(0, 1, 0);
    const axisZ = BABYLON.Mesh.CreateLines("axisZ", [
                BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
                new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
            ], scene);
    axisZ.color = new BABYLON.Color3(0, 0, 1);
};