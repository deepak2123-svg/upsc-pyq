export function canonicalSubjectLabel(subject:string){return ({Environment:'Environment & Ecology',Polity:'Polity & Governance',Science:'Science & Technology'} as Record<string,string>)[subject]||subject;}
/** Display labels can improve without retiring IDs already stored by students. */
export function subjectScopeKey(subject:string){return ({'Environment & Ecology':'environment','Polity & Governance':'polity','Science & Technology':'science'} as Record<string,string>)[subject]||subject.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
