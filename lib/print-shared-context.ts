type SharedContext={id:string;label:string;promptLines:string[]};
/** Standalone snapshots keep the full material. In a printed set only, an
 * explicitly linked identical prefix can refer back to its first printed item.
 * Unlabelled or mismatching material is never inferred or removed. */
export function printPromptLines(questions:readonly {id:string;promptLines:string[];sharedContext?:SharedContext}[]){
 const seen=new Map<string,{lines:string[];index:number}>();
 return new Map(questions.map((q,index)=>{
  const context=q.sharedContext;
  if(!context||!context.promptLines.length||!context.promptLines.every((line,i)=>q.promptLines[i]===line))return[q.id,q.promptLines];
  const previous=seen.get(context.id);
  if(!previous){seen.set(context.id,{lines:context.promptLines,index});return[q.id,q.promptLines];}
  if(JSON.stringify(previous.lines)!==JSON.stringify(context.promptLines))return[q.id,q.promptLines];
  return[q.id,[`${context.label}: see Question ${previous.index+1}.`,...q.promptLines.slice(context.promptLines.length)]];
 }));
}
