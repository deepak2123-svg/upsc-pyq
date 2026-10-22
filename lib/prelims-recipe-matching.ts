import {getQuestionPaths,type PyqQuestion} from './pyq-catalog';
import {matchesPlacementLocations,type PlacementRecipe} from './placement-recipe-core.ts';

/** All filters must match one approved location, not unrelated halves of two paths. */
export function matchesPlacementRecipe(question:PyqQuestion,recipe:PlacementRecipe) {
  return matchesPlacementLocations(question.exam,getQuestionPaths(question),recipe);
}
