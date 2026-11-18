import type {CSSProperties} from 'react';
import { searchPyqs } from '../../lib/pyq-search';
import {PYQ_EXAMS,PYQ_EXAM_COLORS} from '../../lib/pyq-exams';
import {SearchQuestionCard} from './search-question-card';

export function PyqSearch({query=''}:{query?:string}){
 const search=query.trim()?searchPyqs(query):null;
 if(!search)return null;
 const groups=PYQ_EXAMS.map(exam=>({exam,total:search.counts[exam],questions:search.results.filter(question=>question.exam===exam)}));
 return <section className="pyq-search" aria-label="PYQ search results">
  <div className="pyq-search-results" aria-live="polite"><div className="pyq-search-heading"><div><span>Search results</span><h1>“{search.query}” in PYQs</h1><p className="pyq-search-summary">{search.total?`${search.total.toLocaleString('en-IN')} matching MCQ${search.total===1?'':'s'}${search.total>search.results.length?` · showing first ${search.results.length}`:''}`:`No reviewed MCQs match this term.`}</p></div>{search.total>0?<p>Grouped by exam · newest papers first</p>:null}</div>
   {search.total>0?<div className="pyq-search-exam-summary" aria-label={`Matches for ${search.query} by exam`}>{groups.map(({exam,total})=><div key={exam} className={total?'has-matches':'has-no-matches'} style={{'--exam-color':PYQ_EXAM_COLORS[exam]} as CSSProperties}><span>{exam}</span><strong>{total.toLocaleString('en-IN')}</strong><small>{total===1?'MCQ':'MCQs'}</small></div>)}</div>:null}
   {groups.filter(group=>group.questions.length).map(({exam,total,questions})=><section className="pyq-search-exam-group" aria-labelledby={`search-${exam}`} key={exam} style={{'--exam-color':PYQ_EXAM_COLORS[exam]} as CSSProperties}><header><div><i aria-hidden="true"/><h2 id={`search-${exam}`}>{exam}</h2><span>{total.toLocaleString('en-IN')} match{total===1?'':'es'}</span></div><small>Most recent first</small></header><div className="pyq-search-exam-cards">{questions.map(question=><SearchQuestionCard question={question} key={question.id}/>)}</div></section>)}
  </div>
 </section>;
}
