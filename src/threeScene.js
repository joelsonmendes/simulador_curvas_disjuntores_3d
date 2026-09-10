import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CURVES } from "./data.js";

export class BreakerScene{
  constructor(container,onSelect){
    this.container=container;
    this.onSelect=onSelect;
    this.breakers={};
    this.section=false;
    this.activeCurve="C";

    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(34,1,0.1,100);
    this.camera.position.set(7.2,4.2,8.8);

    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;
    this.controls.target.set(0,1.4,0.2);
    this.controls.minDistance=4.5;
    this.controls.maxDistance=15;

    this.raycaster=new THREE.Raycaster();
    this.pointer=new THREE.Vector2();

    this.setupLights();
    this.buildEnvironment();
    this.buildBreakers();

    this.renderer.domElement.addEventListener("pointerdown",e=>this.pick(e));

    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.animate();
  }

  setupLights(){
    this.scene.add(new THREE.HemisphereLight(0xa9d4ff,0x0d1520,1.25));

    const key=new THREE.DirectionalLight(0xffffff,2.2);
    key.position.set(5,8,6);
    key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);
    key.shadow.camera.near=0.5;
    key.shadow.camera.far=30;
    key.shadow.camera.left=-8;
    key.shadow.camera.right=8;
    key.shadow.camera.top=8;
    key.shadow.camera.bottom=-8;
    this.scene.add(key);

    const fill=new THREE.DirectionalLight(0x79aefc,1.25);
    fill.position.set(-5,4,2);
    this.scene.add(fill);

    const rim=new THREE.DirectionalLight(0xff9b45,0.7);
    rim.position.set(2,5,-5);
    this.scene.add(rim);

    const glow=new THREE.PointLight(0x4e8fff,16,14);
    glow.position.set(0,2.2,4.2);
    this.scene.add(glow);
  }

  buildEnvironment(){
    const back=new THREE.Mesh(
      new THREE.BoxGeometry(8.5,5.8,0.28),
      new THREE.MeshStandardMaterial({color:0xc6ccd4,metalness:0.45,roughness:0.58})
    );
    back.position.set(0,1.5,-0.95);
    back.receiveShadow=true;
    this.scene.add(back);

    const frameL=new THREE.Mesh(
      new THREE.BoxGeometry(0.22,5.95,0.32),
      new THREE.MeshStandardMaterial({color:0x081524,metalness:0.45,roughness:0.42})
    );
    frameL.position.set(-4.16,1.5,-0.9);
    const frameR=frameL.clone(); frameR.position.x=4.16;
    const frameT=new THREE.Mesh(
      new THREE.BoxGeometry(8.54,0.22,0.32),
      new THREE.MeshStandardMaterial({color:0x081524,metalness:0.45,roughness:0.42})
    );
    frameT.position.set(0,4.39,-0.9);
    this.scene.add(frameL,frameR,frameT);

    const rail=new THREE.Mesh(
      new THREE.BoxGeometry(6.3,0.18,0.16),
      new THREE.MeshStandardMaterial({color:0xbfc8d0,metalness:0.9,roughness:0.22})
    );
    rail.position.set(0,1.18,-0.4);
    this.scene.add(rail);

    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(18,18),
      new THREE.MeshStandardMaterial({color:0x0c1620,roughness:0.92})
    );
    floor.rotation.x=-Math.PI/2;
    floor.position.y=-1.35;
    floor.receiveShadow=true;
    this.scene.add(floor);

    const grid=new THREE.GridHelper(14,28,0x315170,0x1d2b3b);
    grid.position.y=-1.34;
    this.scene.add(grid);
  }

  roundedRectShape(w,h,r){
    const x=-w/2,y=-h/2;
    const s=new THREE.Shape();
    s.moveTo(x+r,y);
    s.lineTo(x+w-r,y);
    s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);
    s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);
    s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);
    s.quadraticCurveTo(x,y,x+r,y);
    return s;
  }

  makeCurvedFrontShell(){
    const shape=this.roundedRectShape(1.62,3.44,0.12);
    const geom=new THREE.ExtrudeGeometry(shape,{
      depth:1.24,
      bevelEnabled:true,
      bevelSegments:3,
      steps:1,
      bevelSize:0.03,
      bevelThickness:0.03,
      curveSegments:20
    });
    geom.center();
    return geom;
  }

  makeToggleGeometry(){
    const shape=this.roundedRectShape(0.74,0.9,0.14);
    const geom=new THREE.ExtrudeGeometry(shape,{
      depth:0.36,
      bevelEnabled:true,
      bevelSegments:2,
      steps:1,
      bevelSize:0.04,
      bevelThickness:0.04,
      curveSegments:14
    });
    geom.center();
    return geom;
  }

  makeTerminalScrew(){
    const g=new THREE.Group();
    const ring=new THREE.Mesh(
      new THREE.CylinderGeometry(0.16,0.16,0.12,30),
      new THREE.MeshStandardMaterial({color:0xb9c5d1,metalness:0.95,roughness:0.2})
    );
    ring.rotation.z=Math.PI/2;
    const head=new THREE.Mesh(
      new THREE.CylinderGeometry(0.105,0.105,0.06,26),
      new THREE.MeshStandardMaterial({color:0x5b6d7c,metalness:1,roughness:0.18})
    );
    head.rotation.z=Math.PI/2;
    head.position.x=0.03;
    const slot1=new THREE.Mesh(
      new THREE.BoxGeometry(0.01,0.07,0.16),
      new THREE.MeshStandardMaterial({color:0x9ac9ff,metalness:0.45,roughness:0.28,emissive:0x25466e,emissiveIntensity:0.08})
    );
    slot1.position.x=0.062;
    const slot2=slot1.clone();
    slot2.rotation.x=Math.PI/2;
    g.add(ring,head,slot1,slot2);
    return g;
  }

  makeSidePort(){
    const g=new THREE.Group();
    const out=new THREE.Mesh(
      new THREE.CylinderGeometry(0.12,0.12,0.12,24),
      new THREE.MeshStandardMaterial({color:0xd7dde4,metalness:0.45,roughness:0.45})
    );
    out.rotation.z=Math.PI/2;
    const inr=new THREE.Mesh(
      new THREE.CylinderGeometry(0.07,0.07,0.14,20),
      new THREE.MeshStandardMaterial({color:0x8f99a4,metalness:0.9,roughness:0.22})
    );
    inr.rotation.z=Math.PI/2;
    inr.position.x=0.01;
    g.add(out,inr);
    return g;
  }

  makeLabel(text,color){
    const canvas=document.createElement("canvas");
    canvas.width=320;
    canvas.height=150;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#f5f6f8";
    ctx.fillRect(0,0,320,150);
    ctx.fillStyle=color;
    ctx.fillRect(0,0,320,26);
    ctx.fillStyle="#1a2129";
    ctx.font="900 58px system-ui";
    ctx.textAlign="center";
    ctx.fillText(text,160,90);
    ctx.font="700 18px system-ui";
    ctx.fillStyle="#4e5967";
    ctx.fillText("230/400V~",160,117);
    ctx.strokeStyle="#9aa7b5";
    ctx.lineWidth=2;
    ctx.strokeRect(100,124,60,18);
    ctx.font="700 16px system-ui";
    ctx.fillText("6000",130,139);
    ctx.fillText("3",184,139);
    const tex=new THREE.CanvasTexture(canvas);
    tex.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(
      new THREE.PlaneGeometry(0.72,0.48),
      new THREE.MeshBasicMaterial({map:tex,transparent:true})
    );
    return mesh;
  }

  buildOneBreaker(curve){
    const group=new THREE.Group();
    group.userData.curve=curve;

    const shellMat=new THREE.MeshPhysicalMaterial({
      color:0xf3f4f6,
      transmission:0.18,
      transparent:true,
      opacity:1,
      roughness:0.43,
      metalness:0.02,
      clearcoat:0.28,
      thickness:0.35
    });
    const translucentMat=new THREE.MeshPhysicalMaterial({
      color:0xf3f5f7,
      transmission:0.78,
      transparent:true,
      opacity:0.52,
      roughness:0.12,
      metalness:0.0,
      clearcoat:0.5,
      thickness:0.4
    });
    const darkMat=new THREE.MeshStandardMaterial({color:0x202734,roughness:0.4,metalness:0.3});
    const metalMat=new THREE.MeshStandardMaterial({color:0xaeb8c3,roughness:0.22,metalness:0.92});
    const copperMat=new THREE.MeshStandardMaterial({color:0xb36d32,roughness:0.32,metalness:0.76});
    const contactMat=new THREE.MeshStandardMaterial({color:0xd6a46b,roughness:0.25,metalness:0.92});

    const body = new THREE.Mesh(this.makeCurvedFrontShell(), shellMat);
    body.castShadow=true;
    body.receiveShadow=true;
    body.position.set(0,0,0);
    body.userData.curve=curve;
    group.add(body);

    const frontCut = new THREE.Mesh(this.makeCurvedFrontShell(), translucentMat);
    frontCut.position.set(-0.09,0,0.02);
    frontCut.scale.set(0.94,0.98,0.74);
    frontCut.userData.curve=curve;
    group.add(frontCut);

    const topBlock=new THREE.Mesh(
      new THREE.BoxGeometry(1.28,0.72,1.18),
      shellMat
    );
    topBlock.position.set(0.16,1.42,0.07);
    topBlock.castShadow=true;
    group.add(topBlock);

    const terminalTopL=this.makeTerminalScrew(); terminalTopL.position.set(-0.18,1.53,0.63);
    const terminalTopR=this.makeTerminalScrew(); terminalTopR.position.set(0.32,1.53,0.63);
    const terminalBotL=this.makeTerminalScrew(); terminalBotL.position.set(-0.18,-1.48,0.63);
    const terminalBotR=this.makeTerminalScrew(); terminalBotR.position.set(0.32,-1.48,0.63);
    group.add(terminalTopL,terminalTopR,terminalBotL,terminalBotR);

    const sidePorts = [
      [-0.74, 0.82, 0.34], [-0.74,-0.84,0.34], [-0.74,-1.23,-0.14],
      [0.74,0.38,0.34],[0.74,-0.48,0.34]
    ].map(([x,y,z])=>{
      const p=this.makeSidePort();
      p.position.set(x,y,z);
      return p;
    });
    group.add(...sidePorts);

    const togglePivot = new THREE.Group();
    togglePivot.position.set(0.37,-0.24,0.72);

    const toggleBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.92,1.18,0.4),
      shellMat
    );
    toggleBase.position.set(0.02,-0.15,-0.02);
    toggleBase.userData.curve=curve;
    group.add(toggleBase);

    const toggle = new THREE.Mesh(this.makeToggleGeometry(), darkMat);
    toggle.rotation.x=Math.PI/2;
    toggle.position.set(0,0.06,0.06);
    toggle.castShadow=true;
    togglePivot.add(toggle);

    const toggleTextCanvas=document.createElement("canvas");
    toggleTextCanvas.width=256; toggleTextCanvas.height=128;
    const tctx=toggleTextCanvas.getContext("2d");
    tctx.fillStyle="#202734"; tctx.fillRect(0,0,256,128);
    tctx.fillStyle="#ffffff"; tctx.font="700 36px system-ui"; tctx.textAlign="center";
    tctx.fillText("O · OFF",128,56);
    tctx.font="700 42px system-ui";
    tctx.fillText("O",128,104);
    const ttex=new THREE.CanvasTexture(toggleTextCanvas);
    ttex.colorSpace=THREE.SRGBColorSpace;
    const toggleText = new THREE.Mesh(
      new THREE.PlaneGeometry(0.64,0.38),
      new THREE.MeshBasicMaterial({map:ttex,transparent:true})
    );
    toggleText.position.set(0,0.05,0.25);
    toggleText.rotation.x=-0.12;
    togglePivot.add(toggleText);
    group.add(togglePivot);

    const label = this.makeLabel(curve + "16", CURVES[curve].color);
    label.position.set(0.04,0.18,0.72);
    label.userData.curve=curve;
    group.add(label);

    const sideFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12,2.4,0.18),
      metalMat
    );
    sideFrame.position.set(0.12,0.17,0.02);
    group.add(sideFrame);

    const bimetal = new THREE.Mesh(
      new THREE.BoxGeometry(0.16,1.54,0.08),
      new THREE.MeshStandardMaterial({color:0xcab58a,metalness:0.78,roughness:0.26})
    );
    bimetal.position.set(-0.12,0.84,0.06);
    bimetal.rotation.z=-0.22;
    group.add(bimetal);

    const bimetalCopper = new THREE.Mesh(
      new THREE.BoxGeometry(0.05,1.52,0.09),
      copperMat
    );
    bimetalCopper.position.set(-0.21,0.84,0.07);
    bimetalCopper.rotation.z=-0.22;
    group.add(bimetalCopper);

    const coilCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.52,0.96,0.52),
      new THREE.MeshStandardMaterial({color:0x1b2432,metalness:0.55,roughness:0.33})
    );
    coilCore.position.set(-0.02,0.1,0.04);
    group.add(coilCore);

    const coil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22,0.22,0.52,30,1,true),
      copperMat
    );
    coil.rotation.z=Math.PI/2;
    coil.position.set(-0.02,0.1,0.05);
    group.add(coil);

    const turns=[];
    for(let i=0;i<10;i++){
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(0.22,0.018,10,30),
        copperMat
      );
      ring.rotation.y=Math.PI/2;
      ring.position.set(-0.24 + i*0.053,0.1,0.05);
      turns.push(ring);
    }
    group.add(...turns);

    const plunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055,0.055,0.56,20),
      metalMat
    );
    plunger.rotation.z=Math.PI/2;
    plunger.position.set(0.02,0.1,0.05);
    group.add(plunger);

    const upperLink = new THREE.Mesh(
      new THREE.BoxGeometry(0.09,1.34,0.14),
      metalMat
    );
    upperLink.position.set(0.25,0.58,0.08);
    upperLink.rotation.z=0.16;
    group.add(upperLink);

    const spring = new THREE.Mesh(
      new THREE.TorusGeometry(0.09,0.02,10,20),
      new THREE.MeshStandardMaterial({color:0x9ca7b2,metalness:0.9,roughness:0.2})
    );
    spring.rotation.x=Math.PI/2;
    spring.position.set(0.26,-0.48,0.12);
    group.add(spring);

    const movingContactArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.5,0.13,0.12),
      contactMat
    );
    movingContactArm.position.set(-0.02,-0.52,0.12);
    movingContactArm.rotation.z=-0.5;
    group.add(movingContactArm);

    const movingTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.07,18,14),
      contactMat
    );
    movingTip.position.set(0.17,-0.38,0.12);
    group.add(movingTip);

    const fixedContact = new THREE.Mesh(
      new THREE.BoxGeometry(0.38,0.12,0.14),
      contactMat
    );
    fixedContact.position.set(-0.18,-0.92,0.12);
    group.add(fixedContact);

    const fixedTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06,18,14),
      contactMat
    );
    fixedTip.position.set(-0.01,-0.92,0.12);
    group.add(fixedTip);

    const lowerSupport = new THREE.Mesh(
      new THREE.BoxGeometry(0.58,0.18,0.16),
      metalMat
    );
    lowerSupport.position.set(0.05,-1.16,0.0);
    group.add(lowerSupport);

    const arcGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.09,16,12),
      new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:0})
    );
    arcGlow.position.set(0.07,-0.67,0.12);
    group.add(arcGlow);

    const selectRing = new THREE.Mesh(
      new THREE.BoxGeometry(1.82,3.66,1.5),
      new THREE.MeshBasicMaterial({color:CURVES[curve].color,wireframe:true,transparent:true,opacity:curve==="C"?0.62:0.07})
    );
    group.add(selectRing);

    group.userData.parts = {
      body, frontCut, togglePivot, bimetal, bimetalCopper, plunger, movingContactArm, movingTip, fixedTip,
      arcGlow, selectRing, label, coil, coilTurns:turns,
      baseBimetalColor:new THREE.Color(0xcab58a),
      baseCopperColor:new THREE.Color(0xb36d32),
      movingBaseRot:-0.5
    };

    return group;
  }

  buildBreakers(){
    const positions = {B:-2.05, C:0, D:2.05};
    ["B","C","D"].forEach(curve=>{
      const breaker = this.buildOneBreaker(curve);
      breaker.position.set(positions[curve],1.02,0.06);
      breaker.rotation.y=0.08;
      this.scene.add(breaker);
      this.breakers[curve]=breaker;
    });
  }

  pick(e){
    const r=this.renderer.domElement.getBoundingClientRect();
    this.pointer.x=((e.clientX-r.left)/r.width)*2-1;
    this.pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);

    const hits=this.raycaster.intersectObjects(Object.values(this.breakers),true);
    if(!hits.length) return;

    let o=hits[0].object;
    while(o && !o.userData.curve) o=o.parent;
    if(o?.userData.curve){
      this.setActive(o.userData.curve);
      this.onSelect?.(o.userData.curve);
    }
  }

  setActive(curve){
    this.activeCurve=curve;
    for(const [k,g] of Object.entries(this.breakers)){
      g.userData.parts.selectRing.material.opacity = k===curve ? 0.62 : 0.07;
    }
  }

  setSection(enabled){
    this.section=enabled;
    for(const g of Object.values(this.breakers)){
      const p=g.userData.parts;
      p.frontCut.visible = enabled;
      p.frontCut.material.opacity = enabled ? 0.58 : 0.12;
      p.body.material.opacity = enabled ? 0.78 : 1;
      p.body.material.transmission = enabled ? 0.12 : 0.02;
    }
  }

  updateLabelTexture(mesh, text, color){
    const canvas = mesh.material.map.image;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#f5f6f8";
    ctx.fillRect(0,0,320,150);
    ctx.fillStyle=color;
    ctx.fillRect(0,0,320,26);
    ctx.fillStyle="#1a2129";
    ctx.font="900 58px system-ui";
    ctx.textAlign="center";
    ctx.fillText(text,160,90);
    ctx.font="700 18px system-ui";
    ctx.fillStyle="#4e5967";
    ctx.fillText("230/400V~",160,117);
    ctx.strokeStyle="#9aa7b5";
    ctx.lineWidth=2;
    ctx.strokeRect(100,124,60,18);
    ctx.font="700 16px system-ui";
    ctx.fillText("6000",130,139);
    ctx.fillText("3",184,139);
    mesh.material.map.needsUpdate=true;
  }

  setRatedCurrent(amps){
    for(const [curve,g] of Object.entries(this.breakers)){
      this.updateLabelTexture(g.userData.parts.label, curve + String(amps), CURVES[curve].color);
    }
  }

  updateSimulation({curve,heat,tripProgress,tripped,mechanism}){
    this.setActive(curve);

    for(const [k,g] of Object.entries(this.breakers)){
      const p=g.userData.parts;
      const active=k===curve;
      const localHeat=active ? heat : 0;
      const trip=active ? Math.min(1,tripProgress) : 0;

      p.bimetal.material.color.copy(p.baseBimetalColor).lerp(new THREE.Color(0xff6b2c),Math.min(1,localHeat*1.1));
      p.bimetalCopper.material.color.copy(p.baseCopperColor).lerp(new THREE.Color(0xff7f3a),Math.min(1,localHeat*1.05));

      p.bimetal.rotation.z = -0.22 - localHeat*0.2;
      p.bimetalCopper.rotation.z = -0.22 - localHeat*0.2;

      const magnetic = active && (mechanism==="magnetic" || mechanism==="magnetic-band");
      p.plunger.position.x = 0.02 + (magnetic ? -0.25*trip : 0);

      const openAmount = tripped ? 1 : (magnetic ? trip*0.75 : 0);
      p.togglePivot.rotation.z = -0.95*openAmount;
      p.movingContactArm.rotation.z = p.movingBaseRot - 0.72*openAmount;
      p.movingTip.position.set(0.17 + 0.18*openAmount, -0.38 + 0.1*openAmount, 0.12);

      p.arcGlow.material.opacity = tripped ? 0.8 : (magnetic ? 0.2*trip : 0);
      p.arcGlow.scale.setScalar(tripped ? 1.9 : 1 + trip*0.35);

      p.selectRing.material.opacity = active ? 0.62 : 0.07;
    }
  }

  resize(){
    const w=this.container.clientWidth;
    const h=this.container.clientHeight;
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }

  animate(){
    requestAnimationFrame(()=>this.animate());
    this.controls.update();
    this.renderer.render(this.scene,this.camera);
  }
}
