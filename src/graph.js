import { CURVES } from "./data.js";
import { estimateTrip } from "./physics.js";

export class TimeCurrentGraph{
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.selected = new Set(["C"]);
    this.currentMultiple = 6;
    this.resizeObserver = new ResizeObserver(()=>this.draw());
    this.resizeObserver.observe(canvas);
  }
  setCurrent(m){ this.currentMultiple=m; this.draw(); }
  setSelected(curves){ this.selected = new Set(curves); this.draw(); }

  xToPx(m,w,p){ const a=Math.log10(.5), b=Math.log10(30); return p.l+(Math.log10(m)-a)/(b-a)*(w-p.l-p.r); }
  yToPx(t,h,p){ const a=Math.log10(.01), b=Math.log10(10000); return h-p.b-(Math.log10(t)-a)/(b-a)*(h-p.t-p.b); }

  draw(){
    const c=this.canvas, rect=c.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    const w=Math.max(420,Math.floor(rect.width*dpr)), h=Math.floor(w*520/900);
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    const ctx=this.ctx; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h); ctx.scale(dpr,dpr);
    const W=w/dpr,H=h/dpr,p={l:58,r:18,t:18,b:48};

    ctx.fillStyle="#071321";ctx.fillRect(0,0,W,H);

    // zonas
    const x105=this.xToPx(1.05,W,p), x3=this.xToPx(3,W,p), x30=this.xToPx(30,W,p);
    ctx.fillStyle="rgba(47,187,122,.08)";ctx.fillRect(p.l,p.t,x105-p.l,H-p.t-p.b);
    ctx.fillStyle="rgba(243,187,62,.06)";ctx.fillRect(x105,p.t,x3-x105,H-p.t-p.b);
    ctx.fillStyle="rgba(238,89,102,.05)";ctx.fillRect(x3,p.t,x30-x3,H-p.t-p.b);

    // grid X
    const xs=[.5,1,1.13,1.45,2,3,5,10,20,30];
    ctx.font="11px system-ui";ctx.textAlign="center";ctx.textBaseline="top";
    xs.forEach(v=>{
      const x=this.xToPx(v,W,p);ctx.strokeStyle="rgba(141,188,248,.14)";ctx.beginPath();ctx.moveTo(x,p.t);ctx.lineTo(x,H-p.b);ctx.stroke();
      ctx.fillStyle="#8ea4bd";ctx.fillText(v+"×",x,H-p.b+8);
    });
    // grid Y
    const ys=[.01,.1,1,10,100,1000,10000];
    ctx.textAlign="right";ctx.textBaseline="middle";
    ys.forEach(v=>{
      const y=this.yToPx(v,H,p);ctx.strokeStyle="rgba(141,188,248,.14)";ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();
      const label=v<1?`${v}s`:v<60?`${v}s`:v<3600?`${v/60}min`:`${(v/3600).toFixed(v===10000?1:0)}h`;
      ctx.fillStyle="#8ea4bd";ctx.fillText(label,p.l-8,y);
    });

    // curvas: banda térmica + faixa magnética
    for(const key of this.selected){
      const cv=CURVES[key], rgb=cv.color;
      ctx.save();
      ctx.strokeStyle=rgb;ctx.fillStyle=rgb;ctx.lineWidth=2.3;
      const pts=[];
      for(let i=0;i<=100;i++){
        const m=1.06+(cv.magMin-1.06)*i/100;
        const t=estimateTrip(key,m).seconds;
        pts.push([this.xToPx(m,W,p),this.yToPx(t,H,p)]);
      }
      ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));ctx.stroke();

      // faixa de tolerância didática
      ctx.globalAlpha=.12;ctx.lineWidth=9;ctx.beginPath();pts.forEach((pt,i)=>i?ctx.lineTo(...pt):ctx.moveTo(...pt));ctx.stroke();ctx.globalAlpha=1;

      const x1=this.xToPx(cv.magMin,W,p), x2=this.xToPx(cv.magMax,W,p);
      ctx.fillStyle=hexToRgba(rgb,.13);ctx.fillRect(x1,p.t,x2-x1,H-p.t-p.b);
      ctx.strokeStyle=hexToRgba(rgb,.75);ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(x1,p.t);ctx.lineTo(x1,H-p.b);ctx.moveTo(x2,p.t);ctx.lineTo(x2,H-p.b);ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle=rgb;ctx.font="800 12px system-ui";ctx.textAlign="left";ctx.fillText(key,x1+5,p.t+8);
      ctx.restore();
    }

    // corrente atual
    const cx=this.xToPx(Math.min(30,Math.max(.5,this.currentMultiple)),W,p);
    ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(cx,p.t);ctx.lineTo(cx,H-p.b);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="800 11px system-ui";ctx.fillText(`I = ${this.currentMultiple.toFixed(1)} × In`,cx,2);

    ctx.fillStyle="#b9c9da";ctx.font="12px system-ui";ctx.textAlign="center";ctx.fillText("Múltiplo da corrente nominal (I / In)",(p.l+W-p.r)/2,H-10);
    ctx.save();ctx.translate(15,(p.t+H-p.b)/2);ctx.rotate(-Math.PI/2);ctx.fillText("Tempo de disparo (escala log)",0,0);ctx.restore();
  }
}
function hexToRgba(hex,a){const h=hex.replace("#","");const n=parseInt(h,16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`}
