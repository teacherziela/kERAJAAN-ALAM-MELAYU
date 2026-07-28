const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
let W=0,H=0,dpr=1,last=performance.now();
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
const world={w:2100,h:1400},camera={x:0,y:0};
const state={running:false,paused:true,name:'Pengembara',className:'2 Adil',hp:5,coins:0,xp:0,quest:0,answers:0,correct:0,keys:{},near:null,player:{x:430,y:410,r:17,speed:225,dir:'down',step:0},battle:null};
const npcs=[
{id:'bendahara',x:540,y:385,name:'Bendahara',role:'bendahara',shirt:'#8a2f3f',skin:'#b87950'},
{id:'pedagang',x:1040,y:780,name:'Pedagang',role:'pedagang',shirt:'#1e728c',skin:'#a86d45'},
{id:'sultan',x:1710,y:300,name:'Sultan',role:'sultan',shirt:'#d2a62f',skin:'#b87950'}];
const enemies=[
{id:'lanun1',x:760,y:540,name:'Lanun Sungai',type:'lanun',hp:2,maxHp:2,alive:true,shirt:'#4b2737'},
{id:'lanun2',x:900,y:665,name:'Lanun Pelabuhan',type:'lanun',hp:2,maxHp:2,alive:true,shirt:'#3d2c63'},
{id:'askar',x:1290,y:570,name:'Askar Portugis',type:'portugis',hp:3,maxHp:3,alive:true,shirt:'#9b1c31'},
{id:'kapten',x:1500,y:420,name:'Kapten Portugis',type:'boss',hp:4,maxHp:4,alive:true,shirt:'#6b0f1a'}];
const coins=[...Array(12)].map((_,i)=>({x:650+i*72,y:500+(i%3)*65,taken:false}));
const obstacles=[
{x:250,y:150,w:300,h:180,type:'istana'},{x:1600,y:130,w:320,h:210,type:'kota'},
{x:810,y:850,w:420,h:160,type:'pelabuhan'},{x:100,y:850,w:280,h:180,type:'kampung'},
{x:1220,y:240,w:180,h:130,type:'gudang'}];
const quizzes=[
{q:'Siapakah pengasas Kesultanan Johor Riau?',o:['Sultan Alauddin Riayat Shah I','Sultan Mahmud Shah','Tun Perak','Raja Ali'],a:0,e:'Sultan Alauddin Riayat Shah I mengasaskan Johor Riau pada tahun 1528.'},
{q:'Apakah pusat pemerintahan pertama Kesultanan Johor Riau?',o:['Kota Kara, Pekan Tua','Batu Sawar','Kota Tinggi','Pulau Penyengat'],a:0,e:'Pusat pemerintahan awal ialah Kota Kara di Pekan Tua.'},
{q:'Mengapakah pusat pemerintahan Johor Riau sering berpindah?',o:['Mengelakkan ancaman musuh','Mencari tanah pertanian','Mengikut musim','Mencari bijih'],a:0,e:'Perpindahan dibuat untuk menghadapi ancaman Portugis, Acheh dan musuh lain.'},
{q:'Siapakah yang membantu pertahanan dan pelayaran Johor Riau?',o:['Orang Laut','Petani','Pelombong','Sami'],a:0,e:'Orang Laut menjadi penunjuk arah, pasukan laut dan penyokong sultan.'},
{q:'Apakah faktor utama Johor Riau menjadi pusat perdagangan unggul?',o:['Kedudukan strategik dan pelabuhan terurus','Cuaca sejuk','Tanah tinggi','Tiada pedagang asing'],a:0,e:'Lokasi strategik dan kemudahan pelabuhan menarik pedagang.'},
{q:'Apakah barangan utama yang diperdagangkan di Johor Riau?',o:['Lada hitam dan rempah','Arang batu','Sutera Jepun sahaja','Gandum'],a:0,e:'Lada hitam, rempah dan hasil tempatan menjadi dagangan penting.'},
{q:'Apakah peranan Bendahara?',o:['Penasihat utama sultan dan pentadbir','Ketua nelayan','Pengawal gudang','Pedagang asing'],a:0,e:'Bendahara membantu sultan mentadbir kerajaan.'},
{q:'Mengapakah Johor Riau penting selepas kejatuhan Melaka?',o:['Meneruskan warisan Kesultanan Melayu Melaka','Menghapuskan perdagangan','Menutup pelabuhan','Menggantikan bahasa Melayu'],a:0,e:'Johor Riau meneruskan kesinambungan warisan politik dan perdagangan Melaka.'}
];
function setQuest(t){$('questText').textContent=t}function updateHud(){$('hp').textContent=state.hp;$('coins').textContent=state.coins;$('xp').textContent=state.xp}
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function drawPerson(x,y,opt={}){
 const s=opt.scale||1,enemy=opt.enemy,shirt=opt.shirt||'#246a73',skin=opt.skin||'#b87950',dir=opt.dir||'down',step=opt.step||0;
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(enemy){ctx.shadowColor='rgba(255,40,40,.8)';ctx.shadowBlur=14}
 // legs
 ctx.strokeStyle='#20242b';ctx.lineWidth=7;ctx.lineCap='round';const swing=Math.sin(step)*4;
 ctx.beginPath();ctx.moveTo(-5,14);ctx.lineTo(-7+swing,32);ctx.moveTo(5,14);ctx.lineTo(7-swing,32);ctx.stroke();
 // body
 ctx.fillStyle=shirt;ctx.beginPath();ctx.moveTo(-12,-3);ctx.lineTo(12,-3);ctx.lineTo(10,18);ctx.lineTo(-10,18);ctx.closePath();ctx.fill();
 // arms
 ctx.strokeStyle=skin;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-11,1);ctx.lineTo(-18,15-swing);ctx.moveTo(11,1);ctx.lineTo(18,15+swing);ctx.stroke();
 // neck/head
 ctx.fillStyle=skin;ctx.fillRect(-3,-9,6,8);ctx.beginPath();ctx.ellipse(0,-18,9,11,0,0,Math.PI*2);ctx.fill();
 // hair/hat
 ctx.fillStyle=enemy?'#241717':'#1d2025';ctx.beginPath();ctx.arc(0,-21,9,Math.PI,Math.PI*2);ctx.fill();
 if(opt.role==='sultan'){ctx.fillStyle='#f6cf54';ctx.fillRect(-10,-32,20,5);ctx.beginPath();ctx.moveTo(-8,-32);ctx.lineTo(-4,-41);ctx.lineTo(0,-32);ctx.lineTo(5,-42);ctx.lineTo(9,-32);ctx.fill()}
 if(opt.type==='portugis'||opt.type==='boss'){ctx.fillStyle='#c8c8c8';ctx.fillRect(-10,-29,20,4);ctx.fillStyle='#9b1c31';ctx.fillRect(6,-38,3,10)}
 // face
 if(dir!=='up'){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-3,-18,1,0,7);ctx.arc(3,-18,1,0,7);ctx.fill()}
 if(enemy){ctx.shadowBlur=0;ctx.fillStyle='rgba(150,0,0,.75)';ctx.fillRect(-16,39,32,5);ctx.fillStyle='#ff4545';ctx.fillRect(-16,39,32*(opt.hp/opt.maxHp),5)}
 ctx.restore();
}
function drawWorld(){const gx=-camera.x,gy=-camera.y;let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#183c46');g.addColorStop(1,'#092730');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(gx,gy);
 ctx.fillStyle='#3b754e';ctx.fillRect(0,0,world.w,world.h);
 ctx.fillStyle='#267da1';ctx.beginPath();ctx.moveTo(0,640);ctx.bezierCurveTo(500,500,850,780,1220,610);ctx.bezierCurveTo(1550,460,1800,590,2100,500);ctx.lineTo(2100,820);ctx.bezierCurveTo(1600,900,1300,780,970,910);ctx.bezierCurveTo(520,1040,300,760,0,920);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#b89a66';ctx.lineWidth=58;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(430,410);ctx.lineTo(680,500);ctx.lineTo(1020,780);ctx.lineTo(1270,580);ctx.lineTo(1510,420);ctx.lineTo(1710,300);ctx.stroke();
 for(let i=0;i<60;i++){let x=(i*151)%world.w,y=(i*97+70)%world.h;if(y>520&&y<980)continue;ctx.fillStyle='#174c31';ctx.beginPath();ctx.arc(x,y,23,0,7);ctx.fill();ctx.fillStyle='#28673f';ctx.beginPath();ctx.arc(x-8,y-8,16,0,7);ctx.fill()}
 obstacles.forEach(o=>{let col=o.type==='pelabuhan'?'#7a573a':o.type==='gudang'?'#76513a':'#7e3d2a';rr(o.x,o.y,o.w,o.h,18,col,'rgba(255,255,255,.2)');ctx.fillStyle='#f1d19c';ctx.font='700 20px Segoe UI';ctx.textAlign='left';ctx.fillText(({istana:'ISTANA LAMA',kota:'KOTA BATU',pelabuhan:'PELABUHAN',kampung:'KAMPUNG',gudang:'GUDANG REMPAH'})[o.type],o.x+18,o.y+35)});
 coins.forEach(c=>{if(c.taken)return;ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(c.x,c.y,10,0,7);ctx.fill();ctx.strokeStyle='#fff3aa';ctx.lineWidth=2;ctx.stroke()});
 npcs.forEach(n=>{drawPerson(n.x,n.y,{shirt:n.shirt,skin:n.skin,role:n.role,scale:1.1});ctx.fillStyle='white';ctx.font='700 13px Segoe UI';ctx.textAlign='center';ctx.fillText(n.name,n.x,n.y+55)});
 enemies.forEach(e=>{if(!e.alive)return;drawPerson(e.x,e.y,{shirt:e.shirt,enemy:true,type:e.type,hp:e.hp,maxHp:e.maxHp,scale:1.12,step:performance.now()/180});ctx.fillStyle='#ffd6d6';ctx.font='700 13px Segoe UI';ctx.textAlign='center';ctx.fillText(e.name,e.x,e.y+58)});
 drawPerson(state.player.x,state.player.y,{shirt:'#1b6d77',skin:'#b87950',dir:state.player.dir,step:state.player.step,scale:1.15});ctx.fillStyle='#fff';ctx.font='700 12px Segoe UI';ctx.textAlign='center';ctx.fillText(state.name,state.player.x,state.player.y+55);
 if(state.near){ctx.fillStyle='#ffd166';ctx.font='700 14px Segoe UI';ctx.fillText('Tekan E / TINDAKAN',state.player.x,state.player.y-55)}ctx.restore();
 let v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.2,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.42)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H)}
function collide(x,y){if(x<20||y<20||x>world.w-20||y>world.h-20)return true;return obstacles.some(o=>x>o.x-20&&x<o.x+o.w+20&&y>o.y-25&&y<o.y+o.h+25)}
function loop(now){let dt=Math.min((now-last)/1000,.033);last=now;if(state.running&&!state.paused){let dx=0,dy=0;if(state.keys.ArrowLeft||state.keys.a)dx--;if(state.keys.ArrowRight||state.keys.d)dx++;if(state.keys.ArrowUp||state.keys.w)dy--;if(state.keys.ArrowDown||state.keys.s)dy++;if(dx||dy){let len=Math.hypot(dx,dy);dx/=len;dy/=len;state.player.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');state.player.step+=dt*10;let nx=state.player.x+dx*state.player.speed*dt,ny=state.player.y+dy*state.player.speed*dt;if(!collide(nx,state.player.y))state.player.x=nx;if(!collide(state.player.x,ny))state.player.y=ny}
 coins.forEach(c=>{if(!c.taken&&Math.hypot(c.x-state.player.x,c.y-state.player.y)<30){c.taken=true;state.coins+=10;state.xp+=5;updateHud()}});
 let people=[...npcs,...enemies.filter(e=>e.alive)];state.near=people.find(n=>Math.hypot(n.x-state.player.x,n.y-state.player.y)<75)||null;
 camera.x=Math.max(0,Math.min(world.w-W,state.player.x-W/2));camera.y=Math.max(0,Math.min(world.h-H,state.player.y-H/2))}drawWorld();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function show(id){$(id).classList.add('show');state.paused=true}function hide(id){$(id).classList.remove('show');state.paused=false}
function dialog(npc,text,cb){$('npcAvatar').textContent=npc.role==='sultan'?'👑':npc.role==='bendahara'?'🧔':'🧑';$('npcName').textContent=npc.name.toUpperCase();$('dialogText').textContent=text;show('dialogOverlay');$('dialogNext').onclick=()=>{hide('dialogOverlay');cb&&cb()}}
function interact(){if(state.paused||!state.near)return;let n=state.near;if(n.id==='bendahara'){if(state.quest===0)dialog(n,`${state.name}, empat musuh mengawal laluan ke Kota Batu. Kalahkan mereka satu demi satu dan dapatkan semula Cap Mohor Diraja.`,()=>{state.quest=1;setQuest('Kalahkan Lanun Sungai')});else dialog(n,'Jangan gentar. Gunakan ilmu sejarah sebagai senjata!')}
 else if(n.id==='pedagang'){if(state.quest===3)dialog(n,'Askar Portugis sedang menunggu di hadapan gudang rempah. Kalahkan mereka sebelum mara ke Kota Batu.',()=>{state.quest=4;setQuest('Kalahkan Askar Portugis')});else dialog(n,'Pelabuhan ini hanya selamat apabila semua musuh ditewaskan.')}
 else if(n.id==='sultan'){if(state.quest===6)dialog(n,`Syabas, ${state.name}! Semua musuh telah ditewaskan dan Cap Mohor Diraja kembali ke tangan beta.`,finishGame);else dialog(n,'Masih ada musuh di laluan. Selesaikan perjuanganmu dahulu.')}
 else if(n.alive){let allowed=(n.id==='lanun1'&&state.quest===1)||(n.id==='lanun2'&&state.quest===2)||(n.id==='askar'&&state.quest===4)||(n.id==='kapten'&&state.quest===5);if(allowed)startBattle(n);else dialog({name:n.name,role:'enemy'},'Kau belum bersedia menghadapi aku. Ikut misi semasa dahulu!')}}
addEventListener('keydown',e=>{state.keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='e'||e.key==='E'||e.key===' ')interact()});addEventListener('keyup',e=>state.keys[e.key]=false);
document.querySelectorAll('[data-dir]').forEach(btn=>{let key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[btn.dataset.dir],on=e=>{e.preventDefault();state.keys[key]=true},off=e=>{e.preventDefault();state.keys[key]=false};btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);btn.addEventListener('pointerleave',off)});$('actionBtn').onclick=interact;
$('startBtn').onclick=()=>{state.name=$('playerName').value.trim()||'Pengembara';state.className=$('playerClass').value;state.running=true;hide('startScreen');updateHud();setTimeout(()=>dialog({name:'Penjaga Masa',role:'guide'},`Selamat datang, ${state.name}. Temui Bendahara di Istana Lama. Kali ini ada empat pertempuran sebenar untuk diselesaikan.`),250)};
function startBattle(enemy){state.battle={enemy,idx:Math.floor(Math.random()*quizzes.length)};$('quizFeedback').textContent='';renderBattle();show('quizOverlay')}
function renderBattle(){let b=state.battle,q=quizzes[b.idx%quizzes.length];$('quizQuestion').textContent=q.q;$('quizOptions').innerHTML='';$('enemyHpBar').style.width=(b.enemy.hp/b.enemy.maxHp*100)+'%';q.o.forEach((opt,i)=>{let bt=document.createElement('button');bt.textContent=String.fromCharCode(65+i)+'. '+opt;bt.onclick=()=>answerBattle(i,bt,q);$('quizOptions').appendChild(bt)})}
function answerBattle(i,btn,q){[...$('quizOptions').children].forEach(b=>b.disabled=true);state.answers++;let enemy=state.battle.enemy;if(i===q.a){btn.classList.add('correct');state.correct++;enemy.hp--;state.coins+=25;state.xp+=40;$('quizFeedback').textContent='⚔️ Tepat! Serangan berjaya mengenai musuh.'}else{btn.classList.add('wrong');$('quizOptions').children[q.a].classList.add('correct');state.hp--;$('quizFeedback').textContent='💥 Salah. '+q.e}updateHud();$('enemyHpBar').style.width=Math.max(0,enemy.hp/enemy.maxHp*100)+'%';setTimeout(()=>{if(state.hp<=0){state.hp=5;enemy.hp=enemy.maxHp;updateHud();$('quizFeedback').textContent='Nyawa dipulihkan. Cuba semula!';setTimeout(renderBattle,900);return}if(enemy.hp<=0){enemy.alive=false;hide('quizOverlay');state.coins+=75;state.xp+=120;updateHud();advanceAfter(enemy);return}state.battle.idx++;renderBattle()},1450)}
function advanceAfter(enemy){if(enemy.id==='lanun1'){state.quest=2;setQuest('Kalahkan Lanun Pelabuhan');dialog({name:'Orang Laut',role:'guide'},'Lanun Sungai tumbang! Seorang lagi lanun menunggu berhampiran pelabuhan.')}else if(enemy.id==='lanun2'){state.quest=3;setQuest('Temui Pedagang di pelabuhan');dialog({name:'Orang Laut',role:'guide'},'Dua lanun telah ditewaskan. Temui Pedagang untuk mengetahui lokasi musuh seterusnya.')}else if(enemy.id==='askar'){state.quest=5;setQuest('Kalahkan Kapten Portugis');dialog({name:'Panglima',role:'guide'},'Askar Portugis tumbang. Kapten mereka menunggu di laluan Kota Batu!')}else if(enemy.id==='kapten'){state.quest=6;setQuest('Menghadap Sultan di Kota Batu');dialog({name:'Panglima',role:'guide'},'Kapten Portugis telah dikalahkan! Cap Mohor Diraja berjaya dirampas semula. Bawanya kepada Sultan.') }}
function finishGame(){state.quest=7;setQuest('Misi selesai — semua musuh ditewaskan');let score=state.answers?Math.round(state.correct/state.answers*100):100;$('finalScore').textContent=score+'%';$('finalXp').textContent=state.xp;$('finalCoins').textContent=state.coins;$('completeText').textContent=`${state.name} (${state.className}) berjaya menewaskan dua lanun, seorang askar Portugis dan Kapten Portugis serta menyelamatkan Cap Mohor Diraja.`;show('completeOverlay');localStorage.setItem('sejarahverse_result',JSON.stringify({name:state.name,className:state.className,score,xp:state.xp,coins:state.coins,date:new Date().toISOString()}))}
$('restartBtn').onclick=()=>location.reload();$('soundBtn').onclick=()=>{$('soundBtn').textContent=$('soundBtn').textContent==='🔊'?'🔇':'🔊'};
