import { searchPyqs } from '../../lib/pyq-search';

export function PyqSearch({query=''}:{query?:string}){
 const search=query.trim()?searchPyqs(query):null;
 return <section className="pyq-search" aria-labelledby="pyq-search-title">
  <div className="pyq-search-heading"><div><p className="pyq-kicker">Search the archive</p><h1 id="pyq-search-title">Find any PYQ term</h1><p>Search exact reviewed MCQs by a word, phrase, topic, exam, year or option text.</p></div>
  <form action="/" method="get" role="search"><label htmlFor="pyq-term">PYQ term</label><div><input id="pyq-term" name="q" type="search" defaultValue={query} maxLength={160} placeholder="Try: monsoon, Article 32, photosynthesis…" autoComplete="off"/><button type="submit">Search</button></div></form></div>
  {search?<div className="pyq-search-results" aria-live="polite"><p className="pyq-search-summary">{search.total?`${search.total.toLocaleString('en-IN')} matching MCQ${search.total===1?'':'s'}${search.total>search.results.length?` · showing first ${search.results.length}`:''}`:`No reviewed MCQs match “${search.query}”.`}</p>
   {search.results.map(question=><article className="pyq-search-card" key={question.id}><header><span>{question.exam} {question.year} · {question.paper} · Q{question.questionNumber}</span><small>{question.subject} · {question.topic}</small></header><div className="pyq-search-prompt">{question.promptLines.map((line,index)=><p key={`${question.id}-${index}`}>{line}</p>)}</div><ol className="pyq-search-options">{Object.entries(question.options).map(([letter,text])=><li key={letter}><strong>{letter}</strong><span>{text}</span></li>)}</ol></article>)}
  </div>:null}
 </section>;
}
