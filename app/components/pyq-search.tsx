import { searchPyqs } from '../../lib/pyq-search';
import {SearchQuestionCard} from './search-question-card';

export function PyqSearch({query=''}:{query?:string}){
 const search=query.trim()?searchPyqs(query):null;
 if(!search)return null;
 return <section className="pyq-search" aria-label="PYQ search results">
  <div className="pyq-search-results" aria-live="polite"><p className="pyq-search-summary">{search.total?`${search.total.toLocaleString('en-IN')} matching MCQ${search.total===1?'':'s'}${search.total>search.results.length?` · showing first ${search.results.length}`:''}`:`No reviewed MCQs match “${search.query}”.`}</p>
   {search.results.map(question=><SearchQuestionCard question={question} key={question.id}/>)}
  </div>
 </section>;
}
