import registry from '../content/taxonomy/upsc-prelims-v2-draft.json' with {type:'json'};
import review from '../content/taxonomy/prelims-reviewed-placements.json' with {type:'json'};

export const PRELIMS_TAXONOMY_VERSION=registry.version;
export const prelimsRegistryNodes=registry.nodes;
const nodes=new Map(registry.nodes.map(node=>[node.id,node]));
export type PrelimsPath = {id:string;subject:string;head:string;chapter:string;subtopic:string;headOrder:number;chapterOrder:number;subtopicOrder:number};
export const prelimsPaths:PrelimsPath[]=registry.nodes.filter(node=>node.kind==='subpart').map(node=>{
  const chapter=nodes.get(node.parentId!)!;
  const head=nodes.get(chapter.parentId!)!;
  const subject=nodes.get(head.parentId!)!;
  if(chapter.kind!=='chapter'||head.kind!=='section'||subject.kind!=='subject')throw new Error(`Invalid syllabus ancestry: ${node.id}`);
  return {id:node.id,subject:subject.label,head:head.label,chapter:chapter.label,subtopic:node.label,headOrder:head.order,chapterOrder:chapter.order,subtopicOrder:node.order};
});
const paths=new Map(prelimsPaths.map(path=>[path.id,path]));
export function prelimsPath(id:string){return paths.get(id);}
export const reviewedPrelimsPlacements=new Map(review.records.filter(row=>row.status==='approved').map(row=>[row.questionId,row]));
export {canonicalSubjectLabel,subjectScopeKey} from './syllabus-subjects.ts';
