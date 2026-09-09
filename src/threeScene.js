import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CURVES } from "./data.js";

export class BreakerScene{
  constructor(container,onSelect){
    this.container=container;this.onSelect=onSelect;this.breakers={};this.section=false;this.activeCurve="C";this.currentRated=null;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(36,1,.1,100);
    this.camera.position.set(6.8,4.7,8.5);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.target.set(0,1.2,0);this.controls.minDistance=4.2;this.controls.maxDistance=15;
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.setupLights();this.buildPanel();this.buildBreakers();
    this.renderer.domElement.addEventListener("pointerdown",e=>this.pick(e));
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();
    this.animate();
  }
  setupLights(){
    this.scene.add(new THREE.HemisphereLight(0xaecbff,0x192331,1.2));
    const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(4,8,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x3b87ff,1.2);rim.position.set(-6,4,-3);this.scene.add(rim);
    const warm=new THREE.PointLight(0xff9a4a,20,12);warm.position.set(0,3.8,3.8);this.scene.add(warm);
  }
  buildPanel(){
    const frame=new THREE.Mesh(new THREE.BoxGeometry(7.8,5.2,.35),new THREE.MeshStandardMaterial({color:0x1b2631,metalness:.65,roughness:.35}));
    frame.position.set(0,1.35,-.7);frame.receiveShadow=true;this.scene.add(frame);
    const back=new THREE.Mesh(new THREE.BoxGeometry(7.2,4.6,.12),new THREE.MeshStandardMaterial({color:0xcdd4dc,metalness:.35,roughness:.7}));
    back.position.set(0,1.35,-.48);back.receiveShadow=true;this.scene.add(back);
    const rail=new THREE.Mesh(new THREE.BoxGeometry(5.8,.18,.16),new THREE.MeshStandardMaterial({color:0xbfc8d0,metalness:.9,roughness:.25}));
    rail.position.set(0,1.1,-.26);this.scene.add(rail);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshStandardMaterial({color:0x0f1720,roughness:.9}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-1.3;floor.receiveShadow=true;this.scene.add(floor);
    const grid=new THREE.GridHelper(14,28,0x315170,0x1d2b3b);grid.position.y=-1.29;this.scene.add(grid);
  }
  makeLabel(text,color){
    const canvas=document.createElement("canvas");canvas.width=256;canvas.height=128;const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,256,128);ctx.fillStyle="#f7f7f7";ctx.fillRect(0,0,256,128);
    ctx.fillStyle=color;ctx.fillRect(0,0,256,24);ctx.fillStyle="#101820";ctx.font="900 50px system-ui";ctx.textAlign="center";ctx.fillText(text,128,81);
    ctx.font="700 17px system-ui";ctx.fillStyle="#34414e";ctx.fillText("16 A • 6 kA",128,111);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(1.05,.53),new THREE.MeshBasicMaterial({map:tex}));
  }
  buildBreakers(){
    ["B","C","D"].forEach((curve,i)=>{
      const group=new THREE.Group();group.position.x=(i-1)*2.05;group.position.y=.95;group.userData.curve=curve;
      const shellMat=new THREE.MeshPhysicalMaterial({color:0xf0f2f4,roughness:.45,metalness:.03,transparent:true,opacity:1});
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.45,3.15,1.32),shellMat);body.castShadow=true;body.receiveShadow=true;body.userData.curve=curve;group.add(body);
      const top=new THREE.Mesh(new THREE.BoxGeometry(1.15,.24,1.08),new THREE.MeshStandardMaterial({color:0x28313a,roughness:.55}));top.position.y=1.58;top.userData.curve=curve;group.add(top);
      const bottom=top.clone();bottom.position.y=-1.58;bottom.userData.curve=curve;group.add(bottom);

      const label=this.makeLabel(curve,CURVES[curve].color);label.position.set(0,.35,.67);label.userData.curve=curve;group.add(label);

      const leverPivot=new THREE.Group();leverPivot.position.set(0,.2,.75);const lever=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.25),new THREE.MeshStandardMaterial({color:0x151b22,roughness:.45}));lever.position.y=.18;leverPivot.add(lever);group.add(leverPivot);

      // internos visíveis em modo corte
      const bimetalMat=new THREE.MeshStandardMaterial({color:0xc7b17c,metalness:.8,roughness:.3});
      const bimetal=new THREE.Mesh(new THREE.BoxGeometry(.16,1.3,.13),bimetalMat);bimetal.position.set(-.28,-.25,.1);bimetal.rotation.z=-.11;group.add(bimetal);
      const coil=new THREE.Mesh(new THREE.TorusGeometry(.25,.07,10,30),new THREE.MeshStandardMaterial({color:0xb36d32,metalness:.7,roughness:.35}));coil.rotation.x=Math.PI/2;coil.position.set(.25,.25,.08);group.add(coil);
      const plunger=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.56,16),new THREE.MeshStandardMaterial({color:0x7b8996,metalness:.85,roughness:.2}));plunger.rotation.z=Math.PI/2;plunger.position.set(.25,.25,.08);group.add(plunger);
      const contact1=new THREE.Mesh(new THREE.SphereGeometry(.1,16,10),new THREE.MeshStandardMaterial({color:0xd8b05a,metalness:1,roughness:.2}));contact1.position.set(-.14,.9,.1);group.add(contact1);
      const contact2=contact1.clone();contact2.position.x=.14;group.add(contact2);
      const arc=new THREE.Mesh(new THREE.SphereGeometry(.08,12,8),new THREE.MeshBasicMaterial({color:0x8fd8ff,transparent:true,opacity:0}));arc.position.set(0,.9,.1);group.add(arc);

      const selectRing=new THREE.Mesh(new THREE.BoxGeometry(1.62,3.34,1.48),new THREE.MeshBasicMaterial({color:CURVES[curve].color,wireframe:true,transparent:true,opacity:curve==="C"?.65:.08}));group.add(selectRing);
      group.userData.parts={body,leverPivot,bimetal,coil,plunger,contact2,arc,selectRing,baseBimetalColor:new THREE.Color(0xc7b17c)};
      this.scene.add(group);this.breakers[curve]=group;
    });
  }
  pick(e){
    const r=this.renderer.domElement.getBoundingClientRect();
    this.pointer.x=((e.clientX-r.left)/r.width)*2-1;this.pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(Object.values(this.breakers),true);
    if(hits.length){
      let o=hits[0].object;while(o && !o.userData.curve)o=o.parent;
      if(o?.userData.curve){this.setActive(o.userData.curve);this.onSelect?.(o.userData.curve)}
    }
  }
  setActive(curve){
    this.activeCurve=curve;
    for(const [k,g] of Object.entries(this.breakers)){g.userData.parts.selectRing.material.opacity=k===curve?.65:.08}
  }
  setSection(enabled){
    this.section=enabled;
    for(const g of Object.values(this.breakers)){
      g.userData.parts.body.material.opacity=enabled?.24:1;
      for(const n of ["bimetal","coil","plunger","contact2"]){g.userData.parts[n].visible=enabled}
    }
  }
  setRatedCurrent(amps){
    if(this.currentRated===amps)return;
    this.currentRated=amps;
    for(const [curve,g] of Object.entries(this.breakers)){
      const old=g.children.find(x=>x.material?.map && x.geometry?.type==="PlaneGeometry");
      if(old){g.remove(old);old.material.map.dispose();old.material.dispose();old.geometry.dispose()}
      const label=this.makeLabel(curve,CURVES[curve].color);label.position.set(0,.35,.67);label.userData.curve=curve;
      // repaint rating
      const canvas=label.material.map.image,ctx=canvas.getContext("2d");ctx.fillStyle="#f7f7f7";ctx.fillRect(0,24,256,104);ctx.fillStyle="#101820";ctx.font="900 50px system-ui";ctx.textAlign="center";ctx.fillText(curve,128,81);ctx.font="700 17px system-ui";ctx.fillStyle="#34414e";ctx.fillText(`${amps} A • 6 kA`,128,111);label.material.map.needsUpdate=true;g.add(label)
    }
  }
  updateSimulation({curve,heat,tripProgress,tripped,mechanism}){
    this.setActive(curve);
    for(const [k,g] of Object.entries(this.breakers)){
      const p=g.userData.parts;
      const active=k===curve;
      const localHeat=active?heat:0;
      p.bimetal.material.color.copy(p.baseBimetalColor).lerp(new THREE.Color(0xff4d1f),Math.min(1,localHeat));
      p.bimetal.rotation.z=-.11-(active?localHeat*.18:0);
      p.plunger.position.x=.25+(active && (mechanism==="magnetic"||mechanism==="magnetic-band")?-.22*Math.min(1,tripProgress):0);
      p.leverPivot.rotation.z=active && tripped?-.9:0;
      p.contact2.position.x=active && tripped?.42:.14;
      p.arc.material.opacity=active && tripped?.75:0;
      p.arc.scale.setScalar(active && tripped?1.8:1);
    }
  }
  resize(){
    const w=this.container.clientWidth,h=this.container.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)
  }
  animate(){requestAnimationFrame(()=>this.animate());this.controls.update();this.renderer.render(this.scene,this.camera)}
}
