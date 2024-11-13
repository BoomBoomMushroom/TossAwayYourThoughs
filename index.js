const canvas = document.getElementById("canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const ctx = canvas.getContext("2d")

const tossThoughtButton = document.getElementById("tossThought")
const thoughtInput = document.getElementById("thoughtInput")


const moonImage = new Image()
moonImage.src = "./assets/moon.png"

const backgroundGradient = ctx.createLinearGradient(canvas.width-(canvas.width/1.2), 0, 0, canvas.height)
backgroundGradient.addColorStop(0, "#000000");
backgroundGradient.addColorStop(1, "#16062D");

let waveBase = canvas.height - (canvas.height / 3)
let wavePoints = []
for(let x=0; x<canvas.width; x+=1){
    wavePoints.push({
        x: x,
        y: waveBase,
    })
}

function interpolateColor(color1, color2, factor) {
    if (factor <= 0) return color1;
    if (factor >= 1) return color2;
  
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
  
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
  
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
  
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
function lerp(start, end, amt) {
    return start + (end - start) * amt;
}
function lerpThree(a, b, c, amt) {
    if (amt <= 0.5) {
        return lerp(a, b, amt * 2); // Lerp from a to b for the first half
    } else {
        return lerp(b, c, (amt - 0.5) * 2); // Lerp from b to c for the second half
    }
}

let t = 0
var lastUpdate = Date.now();
let noise = null

const noiseCanvas = document.createElement("canvas")
noiseCanvas.width = canvas.width
noiseCanvas.height = canvas.height
const noiseCtx = noiseCanvas.getContext("2d")
let waterPattern = null

let grabbingElement = null
let mousePos = null
let fallableElements = []
let waterSplashes = []

function splash(x){
    for(let i=0; i<20; i++){
        waterSplashes.push({
            x: x,
            y: waveBase,
            vx: (Math.random() - 0.5) * 380,
            vy: (-1 * (Math.random() + 2)) * 120,
            rotation: Math.random() * (Math.PI*2),
            vr: (Math.random() > 0.5 ? -1 : 1) * Math.random() * Math.PI
        })
    }
}

let stars = []
for(let x=0; x<canvas.width; x+=5){
    for(let y=0;y<waveBase; y+=5){
        if(Math.random() >= 0.001){ continue }
        stars.push({
            x: x,
            y: y,
            sizeOffset: Math.random() * 100,
            loopTime: Math.random() * 10,
            rotation: Math.random() * (Math.PI*2),
        })
        y += 12
        x += 3
    }
}

tossThoughtButton.onclick = (event)=>{
    event.preventDefault()
    let thought = thoughtInput.value
    thoughtInput.value = ""

    let thoughtData = document.createElement("h2")
    thoughtData.innerText = thought
    thoughtData.style.top = "0px"
    thoughtData.style.left = canvas.width/2 + "px"
    thoughtData.classList.add("moveable")
    document.body.appendChild(thoughtData)

    thoughtData.onmousedown = (e)=>{
        for(let i=0; i<fallableElements.length; i++){
            grabbingElement = thoughtData

            let ele = fallableElements[i]
            if(ele["element"] == thoughtData){
                ele["offsetX"] = mousePos["x"] - ele["x"]
                ele["offsetY"] = mousePos["y"] - ele["y"]
            }
        }
    }
    fallableElements.push({
        element: thoughtData,
        x: canvas.width/2,
        y: 0,
        vx: 0,
        vy: 0,
        offsetX: 0,
        offsetY: 0,
    })
}

document.addEventListener("mousemove", (e)=>{
    mousePos = {x: e.clientX, y: e.clientY}
})
document.addEventListener("mouseup", (e)=>{
    grabbingElement = null
})

setInterval(()=>{
    /*
    if(noise==null){
        try{
            noise = new noisejs.Noise(Math.random())
        }
        catch(e){ return }
    }
    */

    let now = Date.now();
    let dt = now - lastUpdate;
    lastUpdate = now;
    dt = dt / 1000

    for(let i=0; i<fallableElements.length; i++){
        let ele = fallableElements[i]

        let element = ele["element"]
        ele["vy"] += 9.8 / 4 * dt

        if(grabbingElement == element){
            ele["vy"] = 0
            ele["x"] = mousePos["x"] - ele["offsetX"]
            ele["y"] = mousePos["y"] - ele["offsetY"]
        }
        else if(ele["y"] > waveBase){
            let centerX = ele["x"] + element.getBoundingClientRect()["width"]/2

            splash(centerX)
            fallableElements.splice(i, 1)
            i--
            element.remove()
        }

        ele["x"] += ele["vx"]
        ele["y"] += ele["vy"]

        element.style.top = ele["y"] + "px"
        element.style.left = ele["x"] + "px"
    }

    ctx.fillStyle = backgroundGradient
    ctx.fillRect(0,0, canvas.width, canvas.height)

    for(let i=0; i<stars.length; i++){
        let star = stars[i]
        let starLoopTime = star["loopTime"] + 20
        let lerpTimeValue = ( (t + star["sizeOffset"]) % starLoopTime) / starLoopTime
        let size = lerpThree(3, 5, 3, lerpTimeValue)
        ctx.fillStyle = "#ffffff"
        //ctx.fillRect(star["x"], star["y"], size, size)
        //console.log(size)

        ctx.save();
        ctx.beginPath();
        ctx.translate(star["x"], star["y"]);
        ctx.rotate(star["rotation"]);
        ctx.rect( -size/2, -size/2, size,size);
        ctx.fill();
        ctx.restore();
    }

    for(let i=0; i<waterSplashes.length; i++){
        let splash = waterSplashes[i]
        splash["vy"] += 1
        splash["x"] += splash["vx"] * dt
        splash["y"] += splash["vy"] * dt
        splash["rotation"] += splash["vr"] * dt

        if(splash["y"] > canvas.height){
            waterSplashes.splice(i, 1)
            i--
            continue
        }

        let size = 10
        ctx.fillStyle = "#6666ff"

        ctx.save();
        ctx.beginPath();
        ctx.translate(splash["x"], splash["y"]);
        ctx.rotate(splash["rotation"]);
        ctx.rect( -size/2, -size/2, size, size);
        ctx.fill();
        ctx.restore();
    }

    let xOffset = Math.sin(t * 0.3) * 5
    let yOffset = Math.cos(t * 0.3) * 10
    ctx.drawImage(moonImage, 50 + xOffset, 50 + yOffset, moonImage.width/5, moonImage.height/5)

    // https://stackoverflow.com/questions/34339520/canvas-fill-area-below-or-above-lines
    // Draw Wave
    ctx.beginPath();
    ctx.fillStyle = "#4444ff"
    ctx.strokeStyle = "#4444ff"
    ctx.moveTo(-5, wavePoints[0].y);
    for(let i=1; i<wavePoints.length; i++){
        ctx.lineTo(wavePoints[i].x, wavePoints[i].y);

        let waveX = wavePoints[i].x * 0.01

        wavePoints[i].y = 13 * Math.sin(waveX + t)

        wavePoints[i].y += 3 * Math.sin(waveX * 2)

        wavePoints[i].y += 5 * Math.sin((waveX+t) / 2)

        wavePoints[i].y += waveBase // make sure it is where the wave should be, wave offset if you will
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    t += dt
    //ctx.stroke();
    ctx.closePath();
    //ctx.fillStyle = "#4444ff"
    ctx.fillStyle = waterPattern
    ctx.fill();

    //let value = noise.simplex3(0, 0, t/10) + 0.2
    waterPattern = "#454af5"
    //waterPattern = interpolateColor("#454af5", "#03cefc", value)

    /*
    let depth = 3000
    for(let x=0; x<noiseCanvas.width; x+=depth){
        for(let y=waveBase / 2;y<noiseCanvas.height; y+=depth){
            let useX = x / 1000
            useX += t / 100
            let useY = y / 1000
            useY += t / 100

            let value = noise.simplex3(useX, useY, t/10) + 0.2
            //noiseCtx.fillStyle = "rgb(" + value*255 + "," + value*255 + "," + value*255 + ")"
            noiseCtx.fillStyle = interpolateColor("#454af5", "#03cefc", value)
            noiseCtx.fillRect(x, y, depth, depth)
        }
    }
    let img = document.createElement("img")
    img.onload = ()=>{
        waterPattern = ctx.createPattern(img, "repeat")
    }
    img.src = noiseCanvas.toDataURL()
    */
},1)