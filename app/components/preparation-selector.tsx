"use client";

import {Fragment,useId,useLayoutEffect,useRef,useState} from 'react';
import {PREPARATION_EXAMS,type PreparationExam,type PreparationView} from '../../lib/preparation-exams';

type Props={exam?:PreparationExam;views?:PreparationView[];activeView?:PreparationView;disabled:boolean;onExam:(exam:PreparationExam)=>void;onView:(view:PreparationView)=>void};

/** Presentation state is independent of the saved exam, cart and syllabus view. */
export function PreparationSelector({exam,views,activeView,disabled,onExam,onView}:Props){
 const [expanded,setExpanded]=useState(true);
 const shell=useRef<HTMLDivElement>(null),editor=useRef<HTMLDivElement>(null),summary=useRef<HTMLButtonElement>(null);
 const before=useRef<DOMRect|null>(null);
 const editorId=useId();
 const labels=exam?[`UPSC ${exam}`,...(activeView?[activeView.paper,...(exam==='NDA'&&activeView.paper==='GAT'?[activeView.label]:[])]:[])]:[];
 function toggle(next:boolean){if(disabled)return;before.current=shell.current?.getBoundingClientRect()??null;setExpanded(next);}
 function selectView(view:PreparationView){if(disabled)return;before.current=shell.current?.getBoundingClientRect()??null;onView(view);setExpanded(false);}

 useLayoutEffect(()=>{
  const box=shell.current,options=editor.current,selection=summary.current,start=before.current;
  if(!box||!options||!selection||!start)return;
  before.current=null;
  const collapsed=!expanded;
  options.hidden=collapsed;selection.hidden=!collapsed;
  const end=box.getBoundingClientRect();
  let cancelled=false;
  const animations:Animation[]=[];
  const cleanStyles=()=>{
   for(const element of [options,selection])for(const key of ['position','left','top','width'])element.style.removeProperty(key);
   for(const key of ['height','width','overflow'])box.style.removeProperty(key);
  };
  function finish(){
   if(cancelled)return;
   options!.hidden=collapsed;selection!.hidden=!collapsed;
   animations.forEach(animation=>animation.cancel());cleanStyles();
   if(document.activeElement===document.body||box!.contains(document.activeElement)){
    if(collapsed)selection!.focus({preventScroll:true});
    else options!.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({preventScroll:true});
   }
  }
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  const outgoing=collapsed?options:selection,incoming=collapsed?selection:options;
  for(const [element,width]of [[outgoing,start.width],[incoming,end.width]] as const){
   element.hidden=false;Object.assign(element.style,{position:'absolute',left:'0',top:'0',width:`${Math.max(0,width-2)}px`});
  }
  Object.assign(box.style,{height:`${end.height}px`,width:`${end.width}px`,overflow:'clip'});
  const easing='cubic-bezier(.25,.8,.25,1)';
  animations.push(box.animate([{height:`${start.height}px`,width:`${start.width}px`},{height:`${end.height}px`,width:`${end.width}px`}],{duration:520,easing}));
  animations.push(outgoing.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],{duration:130,easing,fill:'both'}));
  animations.push(incoming.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,delay:160,easing,fill:'both'}));
  void Promise.all(animations.map(animation=>animation.finished.catch(()=>{}))).then(finish);
  return()=>{cancelled=true;animations.forEach(animation=>animation.cancel());cleanStyles();};
 },[expanded]);

 return <section className="preparation-navigation" aria-label="Preparation exam and paper" onKeyDown={event=>{if(event.key==='Escape'&&expanded&&exam){event.preventDefault();toggle(false);}}}>
  <div className="preparation-selector-shell" ref={shell} data-collapsed={!expanded}>
   <button type="button" className="preparation-selection" ref={summary} hidden={expanded} inert={expanded} disabled={disabled} aria-label="Change preparation selection" aria-expanded={expanded} aria-controls={editorId} onClick={()=>toggle(true)}>
    <span className="preparation-selection-path">{labels.map((label,i)=><Fragment key={`${i}:${label}`}>{i?<span className="preparation-selection-separator" aria-hidden="true">›</span>:null}{i?<span>{label}</span>:<strong>{label}</strong>}</Fragment>)}</span>
    <span className="preparation-change">Change <span className="preparation-chevron" aria-hidden="true"/></span>
   </button>
   <div className="preparation-selector-options" ref={editor} id={editorId} hidden={!expanded} inert={!expanded}>
    <div className="preparation-choice-row"><span className="preparation-choice-label">Preparing for</span><div role="group" aria-label="Preparing for">{PREPARATION_EXAMS.map(target=><button type="button" key={target} disabled={disabled} aria-pressed={exam===target} onClick={()=>{if(target!==exam)onExam(target);}}>UPSC {target}</button>)}</div></div>
    {views?<div className="preparation-choice-row preparation-choice-divider"><span className="preparation-choice-label">Paper</span><div role="group" aria-label="Paper">{[...new Set(views.map(view=>view.paper))].map(paper=><button type="button" key={paper} disabled={disabled} aria-pressed={activeView?.paper===paper} onClick={()=>{
     const view=views.find(item=>item.paper===paper)!;
     if(exam==='NDA'&&paper==='GAT')onView(activeView?.paper==='GAT'?activeView:view);
     else selectView(view);
    }}>{paper}</button>)}</div></div>:null}
    {exam==='NDA'&&activeView?.paper==='GAT'?<div className="preparation-choice-row preparation-choice-divider"><span className="preparation-choice-label">GAT section</span><div role="group" aria-label="GAT section">{views?.filter(view=>view.paper==='GAT').map(view=><button type="button" key={view.id} disabled={disabled} aria-pressed={activeView.id===view.id} onClick={()=>selectView(view)}>{view.label}</button>)}</div></div>:null}
    {exam==='CDS'?<small className="preparation-selector-note">OTA: English + General Knowledge. Mathematics: IMA / INA / AFA.</small>:null}
   </div>
  </div>
 </section>;
}
