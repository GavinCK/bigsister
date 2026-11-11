// Maths Island stylesheet (lives inside the maths Shadow DOM, so it never clashes with the island CSS)
export const CSS = `
:host{display:block;position:absolute;inset:0;
  --ink:#2B2140;--ink2:#5E5378;--sun:#FFC93C;--octo:#FF7EB3;--ghost:#B49CFF;--leaf:#45D08A;--sky:#5BC8FF;--red:#FF5A6E;--good:#1FA866;--paper:#FFFDF7;
  --head:"Lilita One","Baloo 2",system-ui,sans-serif;--body:"Nunito","Baloo 2","Segoe UI",system-ui,-apple-system,sans-serif;
  --r:22px;--sh:0 5px 0 var(--ink);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
button,input{font:inherit;color:inherit}
button{cursor:pointer;touch-action:manipulation}
[hidden]{display:none!important}
h1,h2,h3{font-family:var(--head);line-height:1.1;margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:8px 18px;border:3px solid var(--ink);border-radius:16px;background:#fff;box-shadow:0 4px 0 var(--ink);font-weight:900;font-size:17px;user-select:none;-webkit-user-select:none}
.btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
.btn:focus-visible,.card:focus-visible,.key:focus-visible{outline:3px solid #2E7DFF;outline-offset:3px}
.btn.pri{background:var(--sun)}.btn.go{background:var(--leaf);color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.25)}.btn.blue{background:var(--sky)}.btn.pink{background:var(--octo)}.btn.ghost{background:transparent;box-shadow:none;border-style:dashed}
.btn.sm{min-height:40px;padding:4px 12px;font-size:15px;border-radius:12px;box-shadow:0 3px 0 var(--ink)}
.btn[disabled]{opacity:.45;pointer-events:none}

/* panda */
.panda{display:block;width:100%;height:auto}
.panda .e-y,.panda .e-h,.panda .m-y,.panda .m-h{display:none}
.panda.happy .e-n,.panda.happy .m-n,.panda.hurt .e-n,.panda.hurt .m-n{display:none}
.panda.happy .e-y,.panda.happy .m-y,.panda.hurt .e-h,.panda.hurt .m-h{display:inline}
.bob{animation:bob 2.6s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.jump{animation:jump .5s ease}
@keyframes jump{0%,100%{transform:translateY(0)}40%{transform:translateY(-16px) rotate(-4deg)}}
.shake{animation:shake .45s ease}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}

/* topic */
.thead{display:grid;grid-template-columns:96px 1fr;gap:16px;align-items:center;background:#fff;border:3px solid var(--ink);border-radius:var(--r);box-shadow:var(--sh);padding:16px;margin-bottom:16px}
.thead .ic{width:96px;height:96px;border-radius:24px;border:3px solid var(--ink);background:var(--c);display:grid;place-items:center;font-size:56px}
.thead .ic.locked{filter:grayscale(1) brightness(1.5) contrast(.4)}
.thead h2{font-size:30px}.thead .zh{font-weight:800;color:var(--ink2)}
.cols{display:grid;grid-template-columns:1.25fr 1fr;gap:16px}
@media (max-width:820px){.cols{grid-template-columns:1fr}}
.panel{background:#fff;border:3px solid var(--ink);border-radius:var(--r);box-shadow:var(--sh);padding:16px 18px;margin-bottom:16px}
.panel h3{font-size:22px;margin-bottom:8px}
.notes{margin:0;padding-left:20px}.notes li{margin:6px 0}
.ex{background:#FFF6D6;border:2.5px dashed var(--ink);border-radius:16px;padding:10px 14px;margin-top:12px}
.ex .exq{font-weight:900}
.skills{list-style:none;margin:0;padding:0}.skills li{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:2px dotted #E2DCF0;font-weight:700}
.skills li:last-child{border-bottom:0}.skills small{color:var(--ink2)}
.modebtns{display:grid;gap:12px}
.modebtn{display:grid;grid-template-columns:52px 1fr;gap:12px;align-items:center;text-align:left;border:3px solid var(--ink);border-radius:18px;box-shadow:var(--sh);padding:12px 14px;background:var(--c,#fff)}
.modebtn:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink)}
.modebtn .ic{font-size:36px;text-align:center}.modebtn b{display:block;font-family:var(--head);font-size:22px}.modebtn span{font-size:14px;font-weight:700}
.src{font-size:13px;color:var(--ink2);font-weight:700}

/* play */
.play{display:grid;grid-template-columns:minmax(0,1fr) 330px;grid-template-areas:"head head" "q side" "ans side" "act side" "work side";grid-template-rows:auto auto auto auto 1fr;gap:12px 16px;min-height:100%}
.phead{grid-area:head;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.chip{display:inline-flex;align-items:center;gap:6px;border:3px solid var(--ink);border-radius:999px;padding:2px 12px;font-weight:900;background:#fff;white-space:nowrap}
.dots{display:flex;flex-wrap:wrap;gap:6px;flex:1;min-width:120px}
.dot{width:30px;height:30px;border-radius:50%;border:2.5px solid var(--ink);background:#fff;font-size:12px;font-weight:900;display:grid;place-items:center;padding:0}
.dot.cur{background:var(--sun);transform:scale(1.12)}.dot.done{background:#D9F7E8}.dot.ok{background:var(--leaf);color:#fff}.dot.no{background:var(--red);color:#fff}.dot.flag{box-shadow:0 0 0 3px var(--octo)}
.timer{font-variant-numeric:tabular-nums}
.timer.warn{background:#FFE0E4;animation:pulse 1s infinite}
@keyframes pulse{50%{transform:scale(1.06)}}
.combo{background:#FFE7F2}
.qcard{grid-area:q;position:relative;background:var(--paper);border:3px solid var(--ink);border-radius:var(--r);box-shadow:var(--sh);padding:16px 64px 16px 18px;min-height:96px}
.qnum{font-family:var(--head);font-weight:800;font-size:16px;color:var(--ink2)}
.qtext{font-size:clamp(21px,2.5vw,28px);font-weight:800;line-height:1.55}
.qcard .say{position:absolute;top:10px;right:10px;width:46px;height:46px;border:3px solid var(--ink);border-radius:14px;background:#fff;font-size:21px;box-shadow:0 3px 0 var(--ink)}
.figwrap{margin-top:8px}.qfig{max-width:260px;width:60%;height:auto;display:block}
.var{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-weight:700}
.fr{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .14em;font-size:.82em;line-height:1.08}
.fr .fn{padding:0 .18em;border-bottom:2.5px solid currentColor}.fr .fd{padding:0 .18em}
.mx{white-space:nowrap}
.blank{display:inline-block;min-width:1.7em;border-bottom:3px solid var(--ink);text-align:center;color:var(--octo);font-weight:900;line-height:1.1}
.blank.wide{min-width:4em}
.fr .blank{min-width:1.2em;border-bottom:0}

.answer{grid-area:ans;display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;background:#fff;border:3px solid var(--ink);border-radius:var(--r);padding:12px 14px;min-height:84px}
.answer .lbl{font-weight:900;color:var(--ink2);font-size:15px}
.aw{display:flex;align-items:center;gap:8px;font-size:26px;font-weight:900}
.aw .pre,.aw .unit{white-space:nowrap}
.abox{width:4.6em;min-width:2.4em;height:58px;border:3px solid var(--ink);border-radius:14px;background:#F7F4FF;text-align:center;font-size:27px;font-weight:900;padding:0 6px;outline:none;caret-color:var(--octo)}
.abox.wide{width:7.2em}
.abox.sm{width:2.6em;height:46px;font-size:23px}
.abox.on{background:#FFF6D6;box-shadow:0 0 0 4px rgba(255,201,60,.55)}
.afr{display:inline-flex;flex-direction:column;gap:5px;align-items:center}
.afr .bar{width:100%;height:4px;background:var(--ink);border-radius:2px}
.modes{display:flex;gap:6px;margin-left:auto}
.mbtn{min-width:52px;height:42px;border:2.5px solid var(--ink);border-radius:12px;background:#fff;font-weight:900;font-size:15px;padding:0 8px}
.mbtn.on{background:var(--ghost);color:#fff}
.mic{width:48px;height:48px;border:3px solid var(--ink);border-radius:50%;background:#fff;font-size:22px;box-shadow:0 3px 0 var(--ink)}
.mic.live{background:var(--red);animation:pulse 1s infinite}
.heard{flex-basis:100%;font-size:14px;color:var(--ink2);font-weight:700}
.choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;width:100%}
.choice{min-height:58px;border:3px solid var(--ink);border-radius:16px;background:#fff;box-shadow:0 4px 0 var(--ink);font-size:21px;font-weight:900;padding:6px 10px}
.choice.on{background:var(--sun)}.choice.right{background:var(--leaf);color:#fff}.choice.wrong{background:var(--red);color:#fff}
.choice:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
.ord{display:flex;flex-direction:column;gap:12px;width:100%}
.ordpool,.ordslots{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:24px;font-weight:900}
.ochip{min-width:74px;min-height:58px;border:3px solid var(--ink);border-radius:14px;background:#FFF6D6;box-shadow:0 3px 0 var(--ink);font-size:24px;font-weight:900;padding:4px 10px}
.ochip.used{opacity:.25;pointer-events:none}
.oslot{min-width:74px;min-height:58px;border:3px dashed var(--ink2);border-radius:14px;display:inline-grid;place-items:center;padding:4px 8px;background:#fff}
.oslot.full{border-style:solid;background:#EAF7FF}
.osign{width:52px;height:52px;border:3px solid var(--ink);border-radius:50%;background:#fff;font-size:24px;font-weight:900;box-shadow:0 3px 0 var(--ink)}
.timebox{display:flex;align-items:center;gap:6px;font-size:28px;font-weight:900}
.ap{display:flex;gap:6px;margin-left:8px}

.act{grid-area:act;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.act .grow{flex:1}
.fb{border:3px solid var(--ink);border-radius:var(--r);padding:12px 16px;background:#fff;box-shadow:var(--sh);width:100%}
.fb.good{background:#E3FBEF}.fb.bad{background:#FFF0F2}.fb.info{background:#FFF8E1}
.fb h4{margin:0 0 4px;font-family:var(--head);font-size:23px}
.fb .steps{margin:8px 0 0;padding-left:20px;font-size:18px}.fb .steps li{margin:3px 0}
.fb .ansline{font-size:20px;font-weight:900;margin-top:4px}
.hintbox{width:100%;background:#FFF8E1;border:2.5px dashed #E0A800;border-radius:16px;padding:8px 14px;font-weight:800}
.hintbox p{margin:4px 0}

.work{grid-area:work;display:flex;flex-direction:column;min-height:240px}
.scratch{position:relative;flex:1;min-height:220px;border:3px solid var(--ink);border-radius:var(--r);overflow:hidden;
  background-color:#fff;background-image:linear-gradient(#E6F4FF 1px,transparent 1px),linear-gradient(90deg,#E6F4FF 1px,transparent 1px);background-size:24px 24px}
.scratch canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}
.scratch .stools{position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:2}
.scratch .stools button{width:42px;height:42px;border:2.5px solid var(--ink);border-radius:12px;background:#fff;font-size:18px}
.scratch .stools button.on{background:var(--sun)}
.scratch .slabel{position:absolute;left:12px;top:8px;font-weight:900;color:#A9B8C8;font-size:14px;pointer-events:none}
.nopaper{flex:1;display:grid;place-items:center;text-align:center;border:3px dashed var(--ink2);border-radius:var(--r);padding:20px;color:var(--ink2);font-weight:800;background:rgba(255,255,255,.7)}
.nopaper .big{font-size:44px}

.side{grid-area:side;display:flex;flex-direction:column;gap:12px}
.keypad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#fff;border:3px solid var(--ink);border-radius:var(--r);padding:10px;box-shadow:var(--sh)}
.key{height:62px;border:3px solid var(--ink);border-radius:14px;background:#F7F4FF;box-shadow:0 3px 0 var(--ink);font-size:26px;font-weight:900;padding:0;user-select:none;-webkit-user-select:none}
.key:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
.key.fn{background:#FFF6D6;font-size:18px}.key.del{background:#FFE0E4}
.mascot{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;background:#fff;border:3px solid var(--ink);border-radius:var(--r);padding:10px;box-shadow:var(--sh)}
.mascot .bubble{font-weight:800;font-size:15px;line-height:1.35}
@media (max-width:900px){
  .play{grid-template-columns:minmax(0,1fr) 290px;grid-template-areas:"head head" "q q" "ans ans" "act act" "work side";grid-template-rows:auto auto auto auto 1fr}
  .key{height:56px}
}
@media (max-width:620px){
  .play{grid-template-columns:1fr;grid-template-areas:"head" "q" "ans" "act" "side" "work";min-height:0}
  .mascot{display:none}.qcard{padding-right:58px}.abox{width:3.6em}.work{min-height:200px}
}

/* results */
.rhead{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center;background:#fff;border:3px solid var(--ink);border-radius:var(--r);box-shadow:var(--sh);padding:18px;margin-bottom:16px}
.rhead h2{font-size:clamp(28px,4vw,40px)}
.score{font-family:var(--head);font-size:44px;font-weight:800;line-height:1}
.bigstars{font-size:46px;letter-spacing:4px}.bigstars span{display:inline-block;animation:pop .5s both}
.bigstars .off{filter:grayscale(1);opacity:.3}
@keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
.medal{font-size:60px;display:inline-block;animation:pop .6s both}
.rewards{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.reward{border:3px solid var(--ink);border-radius:16px;padding:6px 12px;font-weight:900;background:#FFF6D6}
.review{list-style:none;margin:0;padding:0}
.review>li{display:grid;grid-template-columns:44px 1fr;gap:10px;padding:12px 0;border-bottom:2px dotted #E2DCF0}
.review>li:last-child{border-bottom:0}
.review .mk{width:40px;height:40px;border-radius:50%;border:3px solid var(--ink);display:grid;place-items:center;font-weight:900;color:#fff}
.review .mk.ok{background:var(--leaf)}.review .mk.no{background:var(--red)}
.review .rq{font-size:19px;font-weight:800}
.review .ra{font-size:16px;margin-top:2px}
.review details{margin-top:4px}.review summary{cursor:pointer;font-weight:900;color:#2E7DFF}
.review .steps{margin:6px 0 0;padding-left:22px}.review .steps li{margin:2px 0}
.btnrow{display:flex;flex-wrap:wrap;gap:12px;margin:16px 0}

/* modal + toast */
.modal{position:fixed;inset:0;z-index:50;background:rgba(43,33,64,.45);display:grid;place-items:center;padding:16px}
.mbox{width:min(560px,100%);max-height:88vh;overflow:auto;background:#fff;border:3px solid var(--ink);border-radius:26px;box-shadow:0 7px 0 var(--ink);padding:20px 22px;animation:pop .3s both}
.mbox h3{font-size:26px;margin-bottom:8px}
.mbox .row{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;justify-content:flex-end}
.setrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:2px dotted #E2DCF0;flex-wrap:wrap}
.seg{display:flex;flex-wrap:wrap;gap:6px}
.seg button{min-height:40px;border:2.5px solid var(--ink);border-radius:12px;background:#fff;font-weight:900;padding:0 12px}
.seg button.on{background:var(--sky)}
.txtin{height:44px;border:3px solid var(--ink);border-radius:12px;padding:0 12px;font-size:18px;font-weight:800;width:200px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}

.mw{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;font-family:var(--body);color:var(--ink);font-size:17px;line-height:1.45;
  background-color:#EAF7FF;background-image:linear-gradient(rgba(91,200,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(91,200,255,.18) 1px,transparent 1px);background-size:26px 26px}
.mw-in{max-width:1180px;margin:0 auto;padding:16px max(14px,env(safe-area-inset-right)) 40px max(14px,env(safe-area-inset-left));min-height:100%;box-sizing:border-box;display:flex;flex-direction:column}
.mw-in>.play{flex:1}
.art{display:inline-block;vertical-align:middle;line-height:0}.art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(27,42,65,.25))}
.ic .art,.thead .ic .art{width:72%;height:72%}
.thead .ic.locked .art img{filter:brightness(0) opacity(.25)}
.palrow{display:flex;align-items:center;gap:10px;margin-top:6px;font-weight:800}.palrow .art{width:44px;height:44px}
.medalchip{display:inline-flex;align-items:center;gap:4px;font-weight:900}.medalchip .art{width:26px;height:26px}
.rewardrow{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.reward .art{width:26px;height:26px;margin-right:4px}
.giftbtn{background:var(--octo)!important;color:#fff}
.bosshead .ic{background:#2B2140}
.introtips{margin:8px 0 0;padding-left:22px}.introtips li{margin:4px 0}
.zh{display:none}
.stars{letter-spacing:1px;color:#E0A800;font-size:18px;white-space:nowrap}.stars .off{color:#D6D0E4}
.crown{position:absolute;top:-14px;right:-6px;font-size:28px}
`;
