import { CURVES, LOADS, LESSONS, CHALLENGES } from "./data.js";
import { estimateTrip, scenarioMultiple, mechanismLabel, formatTime } from "./physics.js";
import { TimeCurrentGraph } from "./graph.js";

const $=s=>document.querySelector(s);
const ui={
  curve:$("#curveSelect"),rated:$("#ratedCurrent"),load:$("#loadType"),scenario:$("#scenario"),
  slider:$("#currentSlider"),currentValue:$("#currentValue"),ampValue:$("#currentAmpValue"),
  speed:$("#speedSelect"),start:$("#startBtn"),pause:$("#pauseBtn"),reset:$("#resetBtn"),section:$("#sectionBtn"),
  sound:$("#soundToggle"),badge:$("#breakerStateBadge"),state:$("#stateText"),mechanism:$("#mechanismText"),
  tripTime:$("#tripTimeText"),temp:$("#tempText"),selectedLabel:$("#selectedBreakerLabel"),
  guided:$("#guidedModeBtn"),free:$("#freeModeBtn"),compareBtn:$("#compareBtn"),comparePanel:$("#comparePanel"),
  comparisonCards:$("#comparisonCards"),canvas:$("#curveCanvas"),
  lessonTitle:$("#lessonTitle"),lessonBody:$("#lessonBody"),lessonProgress:$("#lessonProgress"),prev:$("#prevLesson"),next:$("#nextLesson"),
  score:$("#scoreValue"),challengeTitle:$("#challengeTitle"),challengeText:$("#challengeText"),
  challengeAnswers:$("#challengeAnswers"),feedback:$("#challengeFeedback"),nextChallenge:$("#nextChallenge"),
  graphB:$("#graphB"),graphC:$("#graphC"),graphD:$("#graphD")
};

const state={curve:"C",rated:16,multiple:6,load:"motor",scenario:"motorStart",speed:1,running:false,elapsed:0,tripped:false,heat:0,lesson:0,score:0,challengeIndex:0,compare:false,free:false,section:false,lastFrame:performance.now()};

const graph=new TimeCurrentGraph(ui.canvas);
let scene;
import("./threeScene.js").then(({BreakerScene})=>{
  scene=new BreakerScene($("#threeScene"),curve=>{ui.curve.value=curve;state.curve=curve;syncAll()});
  $("#loading3d")?.remove();
  scene.setRatedCurrent(state.rated);
  scene.setActive(state.curve);
}).catch(err=>{
  $("#loading3d").textContent="O laboratório 3D não carregou. O restante do simulador continua disponível; verifique a conexão usada para carregar o motor 3D.";
  console.error(err);
});

function tripInfo(){return estimateTrip(state.curve,state.multiple)}
function setScenario(){
  state.load=ui.load.value;state.scenario=ui.scenario.value;
  const m=scenarioMultiple(state.scenario,LOADS[state.load]);
  ui.slider.value=m;state.multiple=m;syncAll();resetSimulation(false)
}
function syncAll(){
  state.curve=ui.curve.value;state.rated=+ui.rated.value;state.multiple=+ui.slider.value;state.speed=+ui.speed.value;
  ui.currentValue.textContent=`${state.multiple.toFixed(1).replace(".",",")} × In`;
  ui.ampValue.textContent=`${Math.round(state.multiple*state.rated)} A`;
  ui.selectedLabel.textContent=`Disjuntor Curva ${state.curve} • ${state.rated} A`;
  graph.setCurrent(state.multiple);
  if(!state.compare)graph.setSelected([state.curve]);
  updateGraphChips();
  renderComparison();
  scene?.setRatedCurrent(state.rated);
  updateStatus();
}
function updateGraphChips(){
  ["B","C","D"].forEach(k=>ui["graph"+k].classList.toggle("active",state.compare||k===state.curve))
}
function updateStatus(){
  const info=tripInfo();
  ui.mechanism.textContent=mechanismLabel(info.mechanism);
  ui.tripTime.textContent=state.tripped?"Circuito interrompido":formatTime(info.seconds);
  const temp=Math.round(25+state.heat*105);ui.temp.textContent=`${temp} °C`;
  if(state.tripped){ui.state.textContent="Desarmado";ui.badge.textContent="DESARMADO";ui.badge.className="badge state-trip"}
  else{ui.state.textContent="Ligado";ui.badge.textContent="LIGADO";ui.badge.className="badge state-on"}
}
function resetSimulation(keepRunning=false){
  state.elapsed=0;state.tripped=false;state.heat=0;state.running=keepRunning;updateStatus();
  scene?.updateSimulation({curve:state.curve,heat:0,tripProgress:0,tripped:false,mechanism:tripInfo().mechanism})
}
function playClick(){
  if(!ui.sound.checked)return;
  try{
    const ac=new (window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),g=ac.createGain();
    o.frequency.value=115;g.gain.setValueAtTime(.035,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.08);
    o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.08)
  }catch{}
}
function tick(now){
  const dt=Math.min(.1,(now-state.lastFrame)/1000);state.lastFrame=now;
  if(state.running&&!state.tripped){
    const info=tripInfo();state.elapsed+=dt*state.speed;
    if(info.mechanism==="thermal"||info.mechanism==="magnetic-band"){
      const thermalTarget=Math.min(1,Math.max(0,(state.multiple-1)/3.5));
      state.heat+=(thermalTarget-state.heat)*dt*.9*state.speed;
    }else if(info.mechanism==="magnetic"){state.heat=Math.min(.15,state.heat+dt*.1)}
    const progress=isFinite(info.seconds)?Math.min(1,state.elapsed/info.seconds):0;
    if(isFinite(info.seconds)&&state.elapsed>=info.seconds&&state.multiple>1.05){state.tripped=true;state.running=false;playClick()}
    scene?.updateSimulation({curve:state.curve,heat:state.heat,tripProgress:progress,tripped:state.tripped,mechanism:info.mechanism});
    updateStatus()
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick);

function renderLesson(){
  const l=LESSONS[state.lesson];ui.lessonTitle.textContent=l.title;ui.lessonBody.innerHTML=l.body;ui.lessonProgress.textContent=`${state.lesson+1}/${LESSONS.length}`;
  ui.prev.disabled=state.lesson===0;ui.next.textContent=state.lesson===LESSONS.length-1?"Recomeçar":"Próximo →";
}
function renderComparison(){
  if(!state.compare)return;
  ui.comparisonCards.innerHTML=["B","C","D"].map(k=>{
    const c=CURVES[k],r=estimateTrip(k,state.multiple);
    return `<article class="compare-card"><h3>Curva ${k}</h3><div class="range">Magnético: ${c.magMin}–${c.magMax} × In</div>
    <p>${c.summary}</p><div class="result"><strong>${mechanismLabel(r.mechanism)}</strong><br><span>${formatTime(r.seconds)}</span></div></article>`
  }).join("")
}
function setCompare(on){
  state.compare=on;ui.compareBtn.setAttribute("aria-pressed",String(on));ui.compareBtn.textContent=on?"Fechar comparação":"Comparar B • C • D";
  ui.comparePanel.classList.toggle("hidden",!on);graph.setSelected(on?["B","C","D"]:[state.curve]);updateGraphChips();renderComparison()
}
function setMode(free){
  state.free=free;ui.guided.classList.toggle("active",!free);ui.free.classList.toggle("active",free);
  ui.guided.setAttribute("aria-pressed",String(!free));ui.free.setAttribute("aria-pressed",String(free));
  $(".lesson-panel").style.display=free?"none":"block"
}

function loadChallenge(){
  const q=CHALLENGES[state.challengeIndex%CHALLENGES.length];
  ui.challengeText.textContent=q.text;ui.feedback.textContent="Escolha uma resposta para receber feedback imediato.";
  ui.challengeAnswers.innerHTML="";
  const answers=q.answer==="T"?[["T","Térmica"],["M","Magnética"]]:[["B","Curva B"],["C","Curva C"],["D","Curva D"]];
  answers.forEach(([value,label])=>{
    const b=document.createElement("button");b.className="answer-btn";b.textContent=label;
    b.onclick=()=>answerChallenge(value,b,q);ui.challengeAnswers.appendChild(b)
  })
}
function answerChallenge(value,button,q){
  [...ui.challengeAnswers.children].forEach(b=>b.disabled=true);
  const ok=value===q.answer;button.classList.add(ok?"correct":"wrong");
  if(ok){state.score+=10;ui.feedback.innerHTML=`<strong>Correto.</strong> ${q.why}`}
  else{ui.feedback.innerHTML=`<strong>Revise o conceito.</strong> ${q.why}`}
  ui.score.textContent=state.score
}

ui.curve.onchange=()=>{state.curve=ui.curve.value;syncAll();resetSimulation(false)};
ui.rated.onchange=()=>{state.rated=+ui.rated.value;syncAll();resetSimulation(false)};
ui.slider.oninput=()=>{state.multiple=+ui.slider.value;syncAll();resetSimulation(false)};
ui.speed.onchange=()=>state.speed=+ui.speed.value;
ui.load.onchange=setScenario;ui.scenario.onchange=setScenario;
ui.start.onclick=()=>{if(state.tripped)resetSimulation(false);state.running=true};
ui.pause.onclick=()=>state.running=false;
ui.reset.onclick=()=>resetSimulation(false);
ui.section.onclick=()=>{state.section=!state.section;ui.section.setAttribute("aria-pressed",String(state.section));scene?.setSection(state.section)};
ui.compareBtn.onclick=()=>setCompare(!state.compare);
ui.guided.onclick=()=>setMode(false);ui.free.onclick=()=>setMode(true);
ui.prev.onclick=()=>{state.lesson=Math.max(0,state.lesson-1);renderLesson()};
ui.next.onclick=()=>{state.lesson=(state.lesson+1)%LESSONS.length;renderLesson()};
ui.nextChallenge.onclick=()=>{state.challengeIndex=(state.challengeIndex+1)%CHALLENGES.length;loadChallenge()};
["B","C","D"].forEach(k=>ui["graph"+k].onclick=()=>{ui.curve.value=k;state.curve=k;syncAll();resetSimulation(false)});

renderLesson();loadChallenge();syncAll();setScenario();
