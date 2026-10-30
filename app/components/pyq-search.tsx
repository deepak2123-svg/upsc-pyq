import { searchPyqs } from '../../lib/pyq-search';
import {MathText} from './math-text';

export function PyqSearch({query=''}:{query?:string}){
 const search=query.trim()?searchPyqs(query):null;
 if(!search)return null;
 return <section className="pyq-search" aria-label="PYQ search results">
  <div className="pyq-search-results" aria-live="polite"><p className="pyq-search-summary">{search.total?`${search.total.toLocaleString('en-IN')} matching MCQ${search.total===1?'':'s'}${search.total>search.results.length?` · showing first ${search.results.length}`:''}`:`No reviewed MCQs match “${search.query}”.`}</p>
   {search.results.map(question=><article className="pyq-search-card" key={question.id}><header><span>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</span><small>{question.subject} · {question.topic}</small></header><div className="pyq-search-prompt">{question.promptLines.map((line,index)=><p key={`${question.id}-${index}`}><MathText value={line}/></p>)}</div><ol className="pyq-search-options">{Object.entries(question.options).map(([letter,text])=><li key={letter}><strong>{letter}</strong><span><MathText value={text}/></span></li>)}</ol></article>)}
  </div>
 </section>;
}
