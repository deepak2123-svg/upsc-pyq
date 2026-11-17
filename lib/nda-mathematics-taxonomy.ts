export const NDA_MATHEMATICS_TAXONOMY_VERSION='nda-mathematics-v2';
export const NDA_MATHEMATICS_HEAD='NDA Mathematics';

export const ndaMathematicsChapters=[
 ['Set, Relation, Function and Number System',['Sets and Venn diagrams','Relations and equivalence','Elementary functions','Binary numbers','Logarithms and number systems']],
 ['Polynomials, Quadratic Equations and Inequalities',['Polynomials and roots','Quadratic equations','Inequalities']],
 ['Sequence and Series',['Arithmetic progressions','Geometric progressions','Harmonic progressions','Series and summation']],
 ['Complex Numbers',['Algebra of complex numbers','Modulus and argument','Roots and geometry']],
 ['Binomial Theorem and Mathematical Induction',['Binomial expansion','General and middle terms','Mathematical induction']],
 ['Permutation and Combination',['Fundamental counting principle','Permutations','Combinations']],
 ['Cartesian Coordinates and Straight Lines',['Cartesian coordinates and distance','Slope and equations of lines','Intersections and families of lines']],
 ['Pair of Straight Lines',['Combined equation of lines','Angle and bisectors']],
 ['Circles',['Equation of a circle','Tangents and chords','Systems of circles']],
 ['Conics — Parabola, Ellipse and Hyperbola',['Parabola','Ellipse','Hyperbola']],
 ['Trigonometry — Ratios, Identities and Equations',['Angles and measures','Ratios and identities','Compound and multiple angles','Trigonometric equations']],
 ['Properties of Triangles and Inverse Trigonometric Functions',['Properties and solution of triangles','Inverse trigonometric functions']],
 ['Height and Distance',['Angles of elevation and depression','Height and distance applications']],
 ['Functions, Limits, Continuity and Differentiability',['Domain and range','Composite and inverse functions','Limits','Continuity and differentiability']],
 ['Derivatives',['Rules of differentiation','Implicit and parametric differentiation','Higher-order derivatives']],
 ['Applications of Derivatives',['Increasing and decreasing functions','Maxima and minima','Tangents and normals']],
 ['Indefinite Integration',['Standard integrals','Substitution','Integration by parts','Partial fractions']],
 ['Definite Integration and Its Applications',['Properties of definite integrals','Area under curves']],
 ['Differential Equation',['Order and degree','Formation','First-order differential equations','Growth and decay']],
 ['Matrices and Determinants',['Types and operations','Determinants and properties','Adjoint and inverse','Systems of linear equations']],
 ['Probability and Probability Distribution',['Sample spaces and events','Addition and multiplication rules','Conditional probability','Bayes theorem','Random variables and binomial distribution']],
 ['Vectors',['Components and magnitude','Vector operations','Dot product','Cross product','Geometrical applications']],
 ['3D Geometry',['Coordinates and distance','Direction cosines and ratios','Lines and planes','Spheres']],
 ['Statistics',['Data representation','Central tendency','Variance and standard deviation','Correlation and regression']],
] as const;

const slug=(value:string)=>value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const leaf=(chapter:string,subtopic:string)=>`subtopic:nda-mathematics:${slug(NDA_MATHEMATICS_HEAD)}:${slug(chapter)}:${slug(subtopic)}`;
const C=Object.fromEntries(ndaMathematicsChapters.map(([chapter])=>[chapter,chapter])) as Record<string,string>;
const target=(chapter:string,subtopic:string)=>({id:leaf(chapter,subtopic),head:NDA_MATHEMATICS_HEAD,chapter,subtopic});

const byOldLeaf:Record<string,ReturnType<typeof target>>={
 'sets-and-venn-diagrams':target(C['Set, Relation, Function and Number System'],'Sets and Venn diagrams'),
 'relations':target(C['Set, Relation, Function and Number System'],'Relations and equivalence'),
 'binary-numbers':target(C['Set, Relation, Function and Number System'],'Binary numbers'),
 'logarithms':target(C['Set, Relation, Function and Number System'],'Logarithms and number systems'),
 'quadratic-equations':target(C['Polynomials, Quadratic Equations and Inequalities'],'Quadratic equations'),
 'inequalities':target(C['Polynomials, Quadratic Equations and Inequalities'],'Inequalities'),
 'arithmetic-geometric-and-harmonic-progressions':target(C['Sequence and Series'],'Arithmetic progressions'),
 'real-and-complex-numbers':target(C['Complex Numbers'],'Algebra of complex numbers'),
 'binomial-theorem':target(C['Binomial Theorem and Mathematical Induction'],'Binomial expansion'),
 'permutations-and-combinations':target(C['Permutation and Combination'],'Fundamental counting principle'),
 'cartesian-coordinates':target(C['Cartesian Coordinates and Straight Lines'],'Cartesian coordinates and distance'),
 'straight-lines':target(C['Cartesian Coordinates and Straight Lines'],'Slope and equations of lines'),
 'circles':target(C['Circles'],'Equation of a circle'),
 'parabola-ellipse-and-hyperbola':target(C['Conics — Parabola, Ellipse and Hyperbola'],'Parabola'),
 'angle-measures':target(C['Trigonometry — Ratios, Identities and Equations'],'Angles and measures'),
 'ratios-and-identities':target(C['Trigonometry — Ratios, Identities and Equations'],'Ratios and identities'),
 'compound-and-multiple-angles':target(C['Trigonometry — Ratios, Identities and Equations'],'Compound and multiple angles'),
 'properties-of-triangles':target(C['Properties of Triangles and Inverse Trigonometric Functions'],'Properties and solution of triangles'),
 'inverse-trigonometric-functions':target(C['Properties of Triangles and Inverse Trigonometric Functions'],'Inverse trigonometric functions'),
 'heights-and-distances':target(C['Height and Distance'],'Height and distance applications'),
 'domain-and-range':target(C['Functions, Limits, Continuity and Differentiability'],'Domain and range'),
 'composite-and-inverse-functions':target(C['Functions, Limits, Continuity and Differentiability'],'Composite and inverse functions'),
 'limits':target(C['Functions, Limits, Continuity and Differentiability'],'Limits'),
 'continuity':target(C['Functions, Limits, Continuity and Differentiability'],'Continuity and differentiability'),
 'derivatives-and-rules':target(C['Derivatives'],'Rules of differentiation'),
 'increasing-and-decreasing-functions':target(C['Applications of Derivatives'],'Increasing and decreasing functions'),
 'maxima-and-minima':target(C['Applications of Derivatives'],'Maxima and minima'),
 'standard-integrals':target(C['Indefinite Integration'],'Standard integrals'),
 'substitution':target(C['Indefinite Integration'],'Substitution'),
 'definite-integrals-and-areas':target(C['Definite Integration and Its Applications'],'Properties of definite integrals'),
 'order-and-degree':target(C['Differential Equation'],'Order and degree'),
 'formation':target(C['Differential Equation'],'Formation'),
 'first-order-equations':target(C['Differential Equation'],'First-order differential equations'),
 'types-and-operations':target(C['Matrices and Determinants'],'Types and operations'),
 'determinants':target(C['Matrices and Determinants'],'Determinants and properties'),
 'adjoint-and-inverse':target(C['Matrices and Determinants'],'Adjoint and inverse'),
 'systems-of-linear-equations':target(C['Matrices and Determinants'],'Systems of linear equations'),
 'events-and-sample-spaces':target(C['Probability and Probability Distribution'],'Sample spaces and events'),
 'addition-and-multiplication-rules':target(C['Probability and Probability Distribution'],'Addition and multiplication rules'),
 'conditional-probability':target(C['Probability and Probability Distribution'],'Conditional probability'),
 'random-variables-and-binomial-distribution':target(C['Probability and Probability Distribution'],'Random variables and binomial distribution'),
 'components-and-magnitude':target(C['Vectors'],'Components and magnitude'),
 'dot-product':target(C['Vectors'],'Dot product'),
 'cross-product':target(C['Vectors'],'Cross product'),
 'geometrical-applications':target(C['Vectors'],'Geometrical applications'),
 'coordinates-and-distance':target(C['3D Geometry'],'Coordinates and distance'),
 'direction-cosines-and-ratios':target(C['3D Geometry'],'Direction cosines and ratios'),
 'lines-and-planes':target(C['3D Geometry'],'Lines and planes'),
 'spheres':target(C['3D Geometry'],'Spheres'),
 'data-representation':target(C['Statistics'],'Data representation'),
 'central-tendency':target(C['Statistics'],'Central tendency'),
 'variance-and-standard-deviation':target(C['Statistics'],'Variance and standard deviation'),
 'correlation-and-regression':target(C['Statistics'],'Correlation and regression'),
};

function refine(oldLeaf:string,text:string){
 const base=byOldLeaf[oldLeaf];
 if(!base)return undefined;
 const s=text.toLowerCase();
 const inChapter=(subtopic:string)=>target(base.chapter,subtopic);
 if(oldLeaf==='arithmetic-geometric-and-harmonic-progressions')return /harmonic|\bhp\b/.test(s)?inChapter('Harmonic progressions'):/geometric|\bgp\b|common ratio/.test(s)?inChapter('Geometric progressions'):/sum|series|sigma|∑/.test(s)?inChapter('Series and summation'):base;
 if(oldLeaf==='real-and-complex-numbers')return /modulus|argument|arg\b/.test(s)?inChapter('Modulus and argument'):/root|locus|argand/.test(s)?inChapter('Roots and geometry'):base;
 if(oldLeaf==='binomial-theorem')return /general term|middle term|coefficient|independent of/.test(s)?inChapter('General and middle terms'):base;
 if(oldLeaf==='permutations-and-combinations')return /select|choose|committee|combination|subset|polygon|handshake/.test(s)?inChapter('Combinations'):/arrang|permut|word|digit|number.*formed/.test(s)?inChapter('Permutations'):base;
 if(oldLeaf==='straight-lines')return /intersection|family|concurrent|pair of lines/.test(s)?inChapter('Intersections and families of lines'):base;
 if(oldLeaf==='circles')return /tangent|chord|normal/.test(s)?inChapter('Tangents and chords'):/two circles|radical|system/.test(s)?inChapter('Systems of circles'):base;
 if(oldLeaf==='parabola-ellipse-and-hyperbola')return /ellipse/.test(s)?inChapter('Ellipse'):/hyperbola/.test(s)?inChapter('Hyperbola'):base;
 if(oldLeaf==='ratios-and-identities'&&/equation|solutions?/.test(s))return inChapter('Trigonometric equations');
 if(oldLeaf==='derivatives-and-rules')return /parametric|implicitly|implicit/.test(s)?inChapter('Implicit and parametric differentiation'):/second derivative|third derivative|d\^2|d2y|higher order/.test(s)?inChapter('Higher-order derivatives'):base;
 if(oldLeaf==='standard-integrals')return /partial fraction/.test(s)?inChapter('Partial fractions'):/by parts/.test(s)?inChapter('Integration by parts'):base;
 if(oldLeaf==='definite-integrals-and-areas'&&/area|bounded|region/.test(s))return inChapter('Area under curves');
 if(oldLeaf==='central-tendency'&&/table|frequency|histogram|chart/.test(s))return inChapter('Data representation');
 return base;
}

export function migrateNdaMathematicsSubtopicId(id:string,question?:{sourceText?:string;promptLines?:string[]}){
 if(!id.startsWith('subtopic:nda-mathematics:'))return id;
 const mapped=refine(id.split(':').at(-1)??'',question?.sourceText??question?.promptLines?.join('\n')??'');
 if(!mapped)throw new Error(`Unmapped NDA Mathematics taxonomy leaf: ${id}`);
 return mapped.id;
}

export function migrateNdaMathematicsQuestion<T extends {subject:string;preparationScope?:string;taxonomySubtopic?:string|null;subtopic?:string;sourceText?:string;promptLines?:string[];additionalPaths?:Array<{subject:string;head:string;chapter:string;subtopic:string;taxonomyId?:string|null}>}>(question:T):T{
 if(question.subject!=='Mathematics'||question.preparationScope!=='maths')return question;
 const oldLeaf=slug(question.taxonomySubtopic||question.subtopic||'');
 const mapped=refine(oldLeaf,question.sourceText??question.promptLines?.join('\n')??'');
 if(!mapped)throw new Error(`Unmapped NDA Mathematics question taxonomy: ${oldLeaf}`);
 return {...question,topic:mapped.chapter,subtopic:mapped.subtopic,taxonomyHead:mapped.head,taxonomyChapter:mapped.chapter,taxonomySubtopic:mapped.subtopic,taxonomyId:mapped.id,taxonomyVersion:NDA_MATHEMATICS_TAXONOMY_VERSION,
  additionalPaths:(question.additionalPaths??[]).map(path=>path.subject==='Mathematics'?{...path,...(byOldLeaf[slug(path.subtopic)]??mapped),subject:'Mathematics',taxonomyId:(byOldLeaf[slug(path.subtopic)]??mapped).id}:path)} as T;
}
