/** Editorial concept expansion. These are practice topics, not additional official papers.
 * Stable concept keys can be shared; the exam view selects its appropriate depth.
 */
export type SyllabusSection = readonly [string, readonly (readonly [string, readonly string[]])[]];
export const defenceWorldHistory: readonly SyllabusSection[] = [
  ['World History',[
    ['Industrial Revolution',['Conditions in Britain','Inventions and inventors','Labour movements','Phases and industries','Origins and terminology']],
    ['Russian Revolution',['1905 Revolution','1917 Revolution']],
    // Structural industrialisation, urbanisation, secularisation and bureaucracy;
    // excludes named-inventor recall and Indian constitutional reform chronology.
    ['Modern Society',['Modernity and social transformation']],
    // Defence-exam world history; no automatic CSE GS transfer.
    ['French Revolution',['Revolutionary government and the Terror']],
    ['First World War',['Economic and social consequences']],
    ['Renaissance',['Art and artists']],
    ['Exploration and Conquest',['European overseas expansion']],
  ]],
];
export const englishSyllabus: readonly SyllabusSection[] = [
  ['Vocabulary', [
    ['Word meanings', ['Synonyms', 'Antonyms', 'Words in context']],
    ['Expressions', ['Idioms and phrases', 'One-word substitutions', 'Phrasal verbs', 'Foreign phrases']],
    ['Usage', ['Confusable words', 'Spelling', 'Collocations']],
  ]],
  ['Grammar', [
    ['Parts of speech', ['Nouns and pronouns', 'Articles and determiners', 'Adjectives and adverbs', 'Prepositions and conjunctions']],
    ['Verbs', ['Tenses and aspect', 'Subject–verb agreement', 'Modals and conditionals', 'Non-finite verbs']],
    ['Sentence structure', ['Clauses and conjunctions', 'Active and passive voice', 'Direct and indirect speech']],
  ]],
  ['Usage and Sentence Skills', [
    ['Error correction', ['Spotting errors', 'Sentence improvement', 'Fill in the blanks']],
    ['Sentence organisation', ['Ordering words', 'Ordering sentences', 'Sentence completion']],
  ]],
  ['Comprehension', [
    ['Reading passages', ['Main idea and purpose', 'Explicit information', 'Inference and tone', 'Vocabulary in passages']],
    ['Cloze passages', ['Grammar in context', 'Vocabulary in context', 'Logical connections']],
  ]],
];
export const elementaryMaths: readonly SyllabusSection[] = [
  ['Arithmetic', [
    ['Number system', ['Integers and fractions', 'HCF and LCM', 'Divisibility', 'Powers, roots and logarithms']],
    ['Commercial arithmetic', ['Ratio and proportion', 'Percentages', 'Profit and loss', 'Simple and compound interest']],
    ['Applied arithmetic', ['Time and work', 'Speed, time and distance', 'Averages and mixtures']],
  ]],
  ['Algebra', [
    ['Expressions and equations', ['Polynomials and identities', 'Linear equations', 'Quadratic equations', 'Simultaneous equations and inequalities']],
    ['Sequences', ['Arithmetic progressions', 'Geometric progressions']],
  ]],
  ['Trigonometry', [
    ['Trigonometric functions', ['Ratios and identities', 'Standard angles', 'Heights and distances']],
  ]],
  ['Geometry and Mensuration', [
    ['Plane geometry', ['Lines and angles', 'Triangles and congruence', 'Similarity', 'Quadrilaterals and polygons', 'Circles and tangents', 'Loci']],
    ['Measurement', ['Perimeters and areas', 'Surface areas', 'Volumes of solids']],
  ]],
  ['Statistics', [
    ['Data summaries', ['Tables and charts', 'Mean, median and mode', 'Frequency distributions']],
  ]],
];
export const ndaMaths: readonly SyllabusSection[] = [
  ['Algebra', [
    ['Foundations', ['Sets and Venn diagrams', 'Relations', 'Real and complex numbers', 'Binary numbers']],
    ['Equations and sequences', ['Quadratic equations', 'Inequalities', 'Arithmetic, geometric and harmonic progressions']],
    ['Counting and expansion', ['Permutations and combinations', 'Binomial theorem', 'Logarithms']],
  ]],
  ['Matrices and Determinants', [
    ['Matrices', ['Types and operations', 'Determinants', 'Adjoint and inverse', 'Systems of linear equations']],
  ]],
  ['Trigonometry', [
    ['Angles and functions', ['Angle measures', 'Ratios and identities', 'Compound and multiple angles', 'Inverse trigonometric functions']],
    ['Applications', ['Properties of triangles', 'Heights and distances']],
  ]],
  ['Analytical Geometry', [
    ['Two dimensions', ['Cartesian coordinates', 'Straight lines', 'Circles', 'Parabola, ellipse and hyperbola']],
    ['Three dimensions', ['Coordinates and distance', 'Direction cosines and ratios', 'Lines and planes', 'Spheres']],
  ]],
  ['Differential Calculus', [
    ['Functions and limits', ['Domain and range', 'Composite and inverse functions', 'Limits', 'Continuity']],
    ['Differentiation', ['Derivatives and rules', 'Increasing and decreasing functions', 'Maxima and minima']],
  ]],
  ['Integral Calculus and Differential Equations', [
    ['Integration', ['Standard integrals', 'Substitution', 'Integration by parts', 'Definite integrals and areas']],
    ['Differential equations', ['Order and degree', 'Formation', 'First-order equations', 'Growth and decay applications']],
  ]],
  ['Vector Algebra', [
    ['Vectors', ['Components and magnitude', 'Addition and scalar multiplication', 'Dot product', 'Cross product', 'Geometrical applications']],
  ]],
  ['Statistics and Probability', [
    ['Statistics', ['Data representation', 'Central tendency', 'Variance and standard deviation', 'Correlation and regression']],
    ['Probability', ['Events and sample spaces', 'Addition and multiplication rules', 'Conditional probability', 'Bayes theorem', 'Random variables and binomial distribution']],
  ]],
];
export const csatSyllabus: readonly SyllabusSection[] = [
  ['Comprehension and Communication', [
    ['Reading comprehension', ['Central idea', 'Inference and assumptions', 'Conclusions', 'Tone and purpose']],
    ['Interpersonal and communication skills', ['Communication principles', 'Interpersonal situations']],
  ]],
  ['Logical Reasoning and Analytical Ability', [
    ['Deductive reasoning', ['Statements and conclusions', 'Syllogisms', 'Assumptions and arguments']],
    ['Analytical reasoning', ['Arrangements and puzzles', 'Directions and relations', 'Sequences and patterns', 'Data sufficiency']],
  ]],
  ['Decision Making and Problem Solving', [
    ['Situational problems', ['Evaluating alternatives', 'Public-service decisions', 'Problem-solving strategies']],
  ]],
  ['General Mental Ability', [
    ['Mental ability', ['Coding and classification', 'Analogies', 'Logical and numerical patterns']],
  ]],
  ['Basic Numeracy', elementaryMaths[0][1]],
  ['Data Interpretation', [
    ['Interpreting data', ['Tables', 'Bar and line charts', 'Pie charts', 'Graphs and data sufficiency']],
  ]],
];
