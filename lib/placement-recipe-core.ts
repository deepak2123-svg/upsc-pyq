import {canonicalSubjectLabel} from './syllabus-subjects.ts';
export type PlacementRecipe={exam:string;sourceMix:boolean;subjects:string[];topics?:string[];subtopics?:string[]};
export type RecipeLocation={subject:string;topic:string;taxonomyId?:string};
export function matchesPlacementLocations(exam:string,paths:readonly RecipeLocation[],recipe:PlacementRecipe) {
  if(!recipe.sourceMix&&exam!==recipe.exam)return false;
  const subjects=new Set(recipe.subjects.map(canonicalSubjectLabel));
  if(!paths.length)return !subjects.size&&!recipe.topics?.length&&!recipe.subtopics?.length;
  return paths.some(path=>(!subjects.size||subjects.has(canonicalSubjectLabel(path.subject)))
    &&(!recipe.topics?.length||recipe.topics.includes(path.topic))
    &&(!recipe.subtopics?.length||Boolean(path.taxonomyId&&recipe.subtopics.includes(path.taxonomyId))));
}
