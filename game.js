
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

let W=0,H=0,dpr=1;
function resize(){
  dpr=Math.min(devicePixelRatio||1,2);
  W=innerWidth; H=innerHeight;
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize); resize();

const state={
  running:false, paused:true, sound:true,
  name:"Pengembara", className:"2 Adil",
  hp:3, coins:0, xp:0, quest:0, answers:0, correct:0,
  player:{x:420,y:420,r:16,speed:210},
  keys:{}, near:null, enemyHp:3, quizIndex:0
};

const world={w:1800,h:1200};
const camera={x:0,y:0};

const npcs=[
  {id:"bendahara",x:520,y:390,r:22,emoji:"👴",name:"Bendahara",color:"#f3c969"},
  {id:"pedagang",x:980,y:680,r:22,emoji:"🧔",name:"Pedagang",color:"#63d7ff"},
  {id:"sultan",x:1450,y:310,r:24,emoji:"👑",name:"Sultan",color:"#ffd166"}
];
const coins=[
  {x:720,y:510,taken:false},{x:800,y:560,taken:false},{x:900,y:620,taken:false},
  {x:1100,y:480,taken:false},{x:1250,y:390,taken:false}
];
const obstacles=[
  {x:250,y:160,w:260,h:170,type:"istana"},
  {x:1320,y:150,w:280,h:180,type:"kota"},
  {x:760,y:740,w:360,h:150,type:"pelabuhan"},
  {x:100,y:720,w:250,h:150,type:"kampung"}
];

const quizzes=[
  {q:"Siapakah pengasas Kesultanan Johor Riau?",o:["Sultan Alauddin Riayat Shah I","Sultan Mahmud Shah","Tun Perak","Raja Ali"],a:0,e:"Sultan Alauddin Riayat Shah I mengasaskan kerajaan Johor Riau pada tahun 1528."},
  {q:"Apakah pusat pemerintahan pertama Kesultanan Johor Riau?",o:["Kota Kara, Pekan Tua","Kota Tinggi","Batu Sawar","Pulau Penyengat"],a:0,e:"Kota Kara di Pekan Tua dipilih sebagai pusat pemerintahan awal."},
  {q:"Mengapakah pusat pemerintahan Johor Riau sering berpindah?",o:["Mencari kawasan tanaman","Mengelakkan ancaman musuh","Mengikut musim tengkujuh","Mencari hasil bijih"],a:1,e:"Perpindahan berlaku terutamanya untuk menghadapi ancaman Portugis, Acheh dan musuh lain."},
  {q:"Siapakah yang banyak membantu pertahanan dan pelayaran Johor Riau?",o:["Orang Laut","Petani","Sami","Pelombong"],a:0,e:"Orang Laut setia kepada sultan serta membantu sebagai penunjuk arah dan pasukan laut."},
  {q:"Apakah faktor utama Johor Riau muncul sebagai pusat perdagangan unggul?",o:["Kedudukan strategik dan kemudahan pelabuhan","Cuaca sejuk","Tanah tinggi","Tiada pedagang asing"],a:0,e:"Lokasi strategik, pelabuhan terurus dan jaringan perdagangan mengangkat Johor Riau."}
];

function setQuest(text){ $("questText").textContent=text; }
function updateHud(){
  $("hp").textContent=state.hp; $("coins").textContent=state.coins; $("xp").textContent=state.xp;
}

function roundedRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}
}
function drawWorld(){
  const gx=-camera.x, gy=-camera.y;
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"#163f4e");grad.addColorStop(1,"#0a2a36");
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  ctx.save();ctx.translate(gx,gy);
  ctx.fillStyle="#326f4b";ctx.fillRect(0,0,world.w,world.h);
  // river
  ctx.fillStyle="#2d8eb3";
  ctx.beginPath();ctx.moveTo(0,570);ctx.bezierCurveTo(420,480,760,690,1100,570);ctx.bezierCurveTo(1400,470,1600,560,1800,500);ctx.lineTo(1800,760);ctx.bezierCurveTo(1400,820,1200,710,900,820);ctx.bezierCurveTo(500,930,300,700,0,820);ctx.closePath();ctx.fill();
  // paths
  ctx.strokeStyle="#c7a56b";ctx.lineWidth=54;ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(420,420);ctx.lineTo(650,470);ctx.lineTo(980,680);ctx.lineTo(1250,430);ctx.lineTo(1450,310);ctx.stroke();

  // trees
  for(let i=0;i<45;i++){
    const x=(i*137)%world.w, y=(i*83+80)%world.h;
    if(y>500&&y<830) continue;
    ctx.fillStyle="#17472f";ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#245d3a";ctx.beginPath();ctx.arc(x-7,y-8,16,0,Math.PI*2);ctx.fill();
  }
  obstacles.forEach(o=>{
    let col=o.type==="pelabuhan"?"#805c3d":"#7c3f2c";
    roundedRect(o.x,o.y,o.w,o.h,18,col,"rgba(255,255,255,.22)");
    ctx.fillStyle="#f2d29b";ctx.font="700 20px Segoe UI";
    const names={istana:"ISTANA LAMA",kota:"KOTA BATU",pelabuhan:"PELABUHAN",kampung:"KAMPUNG"};
    ctx.fillText(names[o.type],o.x+18,o.y+34);
    if(o.type==="pelabuhan"){
      ctx.fillStyle="#e6bb72";
      for(let j=0;j<6;j++)ctx.fillRect(o.x+30+j*52,o.y+70,34,60);
    }
  });

  coins.forEach(c=>{
    if(c.taken)return;
    ctx.beginPath();ctx.arc(c.x,c.y,10,0,Math.PI*2);ctx.fillStyle="#ffd166";ctx.fill();
    ctx.strokeStyle="#fff2a8";ctx.lineWidth=2;ctx.stroke();
  });

  npcs.forEach(n=>{
    ctx.beginPath();ctx.arc(n.x,n.y,n.r+7,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,.12)";ctx.fill();
    ctx.font="34px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(n.emoji,n.x,n.y);
    ctx.font="700 13px Segoe UI";ctx.fillStyle="white";ctx.fillText(n.name,n.x,n.y+42);
  });

  // player
  ctx.beginPath();ctx.arc(state.player.x,state.player.y,state.player.r+7,0,Math.PI*2);ctx.fillStyle="rgba(99,215,255,.25)";ctx.fill();
  ctx.font="34px serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🧑‍🚀",state.player.x,state.player.y);
  ctx.font="700 12px Segoe UI";ctx.fillStyle="#fff";ctx.fillText(state.name,state.player.x,state.player.y+38);

  if(state.near){
    ctx.font="700 14px Segoe UI";ctx.fillStyle="#ffd166";
    ctx.fillText("Tekan E / TINDAKAN",state.player.x,state.player.y-42);
  }
  ctx.restore();

  // vignette
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.2,W/2,H/2,Math.max(W,H)*.75);
  v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.4)");
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}

function collide(x,y){
  if(x<20||y<20||x>world.w-20||y>world.h-20)return true;
  return obstacles.some(o=>x>o.x-18&&x<o.x+o.w+18&&y>o.y-18&&y<o.y+o.h+18);
}

let last=performance.now();
function loop(now){
  const dt=Math.min((now-last)/1000,.033);last=now;
  if(state.running&&!state.paused){
    let dx=0,dy=0;
    if(state.keys.ArrowLeft||state.keys.a)dx--;
    if(state.keys.ArrowRight||state.keys.d)dx++;
    if(state.keys.ArrowUp||state.keys.w)dy--;
    if(state.keys.ArrowDown||state.keys.s)dy++;
    if(dx||dy){
      const len=Math.hypot(dx,dy);dx/=len;dy/=len;
      const nx=state.player.x+dx*state.player.speed*dt;
      const ny=state.player.y+dy*state.player.speed*dt;
      if(!collide(nx,state.player.y))state.player.x=nx;
      if(!collide(state.player.x,ny))state.player.y=ny;
    }
    coins.forEach(c=>{
      if(!c.taken&&Math.hypot(c.x-state.player.x,c.y-state.player.y)<28){
        c.taken=true;state.coins+=10;state.xp+=5;updateHud();
      }
    });
    state.near=npcs.find(n=>Math.hypot(n.x-state.player.x,n.y-state.player.y)<70)||null;
    camera.x=Math.max(0,Math.min(world.w-W,state.player.x-W/2));
    camera.y=Math.max(0,Math.min(world.h-H,state.player.y-H/2));
  }
  drawWorld();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function show(id){$(id).classList.add("show");state.paused=true}
function hide(id){$(id).classList.remove("show");state.paused=false}

function dialog(npc, text, cb){
  $("npcAvatar").textContent=npc.emoji;
  $("npcName").textContent=npc.name.toUpperCase();
  $("dialogText").textContent=text;
  show("dialogOverlay");
  $("dialogNext").onclick=()=>{hide("dialogOverlay");if(cb)cb()};
}

function interact(){
  if(state.paused||!state.near)return;
  const id=state.near.id;
  if(id==="bendahara"){
    if(state.quest===0){
      dialog(state.near,`${state.name}, Cap Mohor Diraja telah dicuri oleh lanun. Pergilah ke pelabuhan dan temui pedagang. Kutip syiling di sepanjang jalan sebagai bekalan.`,()=>{
        state.quest=1;setQuest("Pergi ke pelabuhan dan temui Pedagang");
      });
    }else dialog(state.near,"Cepat, pengembara. Nasib Johor Riau berada di tanganmu!");
  }
  if(id==="pedagang"){
    if(state.quest===1){
      dialog(state.near,"Lanun membawa Cap Mohor ke arah Kota Batu. Sebelum mengejar mereka, buktikan pengetahuanmu tentang Johor Riau!",()=>{
        state.quest=2;setQuest("Kalahkan lanun dalam Cabaran Sejarah");startQuiz();
      });
    }else dialog(state.near,"Pelabuhan Johor kembali sibuk. Tahniah, pengembara!");
  }
  if(id==="sultan"){
    if(state.quest===3){
      dialog(state.near,`Syabas, ${state.name}! Cap Mohor berjaya diselamatkan. Beta menganugerahkan gelaran Penyelamat Johor Riau kepadamu.`,finishGame);
    }else dialog(state.near,"Selesaikan misi Bendahara dahulu sebelum menghadap beta.");
  }
}
addEventListener("keydown",e=>{
  state.keys[e.key]=true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();
  if(e.key==="e"||e.key==="E"||e.key===" ")interact();
});
addEventListener("keyup",e=>state.keys[e.key]=false);

document.querySelectorAll("[data-dir]").forEach(btn=>{
  const key={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"}[btn.dataset.dir];
  const on=ev=>{ev.preventDefault();state.keys[key]=true};
  const off=ev=>{ev.preventDefault();state.keys[key]=false};
  btn.addEventListener("pointerdown",on);btn.addEventListener("pointerup",off);btn.addEventListener("pointercancel",off);btn.addEventListener("pointerleave",off);
});
$("actionBtn").onclick=interact;

$("startBtn").onclick=()=>{
  state.name=$("playerName").value.trim()||"Pengembara";
  state.className=$("playerClass").value;
  state.running=true;hide("startScreen");updateHud();
  setTimeout(()=>dialog({emoji:"🌀",name:"Penjaga Masa"},`Selamat datang, ${state.name} dari ${state.className}. Cari Bendahara berhampiran Istana Lama untuk memulakan misi.`),250);
};

function startQuiz(){
  state.enemyHp=3;state.quizIndex=0;renderQuiz();show("quizOverlay");
}
function renderQuiz(){
  const q=quizzes[state.quizIndex];
  $("quizQuestion").textContent=q.q;
  $("quizFeedback").textContent="";
  $("quizOptions").innerHTML="";
  $("enemyHpBar").style.width=(state.enemyHp/3*100)+"%";
  q.o.forEach((opt,i)=>{
    const b=document.createElement("button");
    b.textContent=String.fromCharCode(65+i)+". "+opt;
    b.onclick=()=>answerQuiz(i,b);
    $("quizOptions").appendChild(b);
  });
}
function answerQuiz(i,btn){
  const q=quizzes[state.quizIndex];
  [...$("quizOptions").children].forEach(b=>b.disabled=true);
  state.answers++;
  if(i===q.a){
    btn.classList.add("correct");state.correct++;state.enemyHp--;state.coins+=20;state.xp+=30;
    $("quizFeedback").textContent="✅ Tepat! Meriam Johor berjaya mengenai kapal lanun.";
  }else{
    btn.classList.add("wrong");$("quizOptions").children[q.a].classList.add("correct");state.hp--;
    $("quizFeedback").textContent="❌ Belum tepat. "+q.e;
  }
  updateHud();$("enemyHpBar").style.width=Math.max(0,state.enemyHp/3*100)+"%";
  setTimeout(()=>{
    if(state.hp<=0){
      state.hp=3;state.enemyHp=3;$("quizFeedback").textContent="Nyawa dipulihkan. Cuba lagi!";
      updateHud();setTimeout(renderQuiz,900);return;
    }
    if(state.enemyHp<=0){
      hide("quizOverlay");state.quest=3;state.coins+=100;state.xp+=150;updateHud();
      setQuest("Bawa Cap Mohor kepada Sultan di Kota Batu");
      dialog({emoji:"⚓",name:"Orang Laut"},"Kapal lanun telah ditewaskan! Cap Mohor Diraja berjaya diperoleh. Bawanya kepada Sultan di Kota Batu.");
      return;
    }
    state.quizIndex=(state.quizIndex+1)%quizzes.length;renderQuiz();
  },1700);
}
function finishGame(){
  state.quest=4;setQuest("Misi selesai — Johor Riau diselamatkan");
  const score=state.answers?Math.round(state.correct/state.answers*100):100;
  $("finalScore").textContent=score+"%";$("finalXp").textContent=state.xp;$("finalCoins").textContent=state.coins;
  $("completeText").textContent=`${state.name} (${state.className}) telah mengembalikan Cap Mohor Diraja dan mempertahankan warisan Kesultanan Johor Riau.`;
  show("completeOverlay");
  localStorage.setItem("sejarahverse_result",JSON.stringify({name:state.name,className:state.className,score,xp:state.xp,coins:state.coins,date:new Date().toISOString()}));
}
$("restartBtn").onclick=()=>location.reload();
$("soundBtn").onclick=()=>{
  state.sound=!state.sound;$("soundBtn").textContent=state.sound?"🔊":"🔇";
};
