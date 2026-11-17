import {expect,test} from '@playwright/test';

const chapters=[
 'Set, Relation, Function and Number System','Polynomials, Quadratic Equations and Inequalities','Sequence and Series','Complex Numbers',
 'Binomial Theorem and Mathematical Induction','Permutation and Combination','Cartesian Coordinates and Straight Lines','Pair of Straight Lines',
 'Circles','Conics — Parabola, Ellipse and Hyperbola','Trigonometry — Ratios, Identities and Equations','Properties of Triangles and Inverse Trigonometric Functions',
 'Height and Distance','Functions, Limits, Continuity and Differentiability','Derivatives','Applications of Derivatives','Indefinite Integration',
 'Definite Integration and Its Applications','Differential Equation','Matrices and Determinants','Probability and Probability Distribution','Vectors','3D Geometry','Statistics',
];

test('NDA maths exposes the 24-chapter taxonomy and its subchapters',async({page})=>{
 await page.goto('/prepare/NDA?view=nda-maths');
 const middle=page.locator('.scope-library-browser');
 await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Mathematics');
 await expect(middle.locator('.scope-card-number')).toHaveText(['Section 1']);
 await middle.getByRole('button',{name:'Open NDA Mathematics',exact:true}).click();
 await expect(middle.locator('.scope-card-number')).toHaveText(Array.from({length:24},(_,i)=>`Chapter ${i+1}`));
 await expect(middle.locator('.explorer-folder')).toHaveText(chapters.map(chapter=>`${chapter}›`));
 await middle.getByRole('button',{name:'Open Matrices and Determinants',exact:true}).click();
 await expect(middle.locator('.scope-card-number')).toHaveText(['20.1','20.2','20.3','20.4']);
 await expect(middle.locator('.explorer-folder')).toHaveText(['Types and operations›','Determinants and properties›','Adjoint and inverse›','Systems of linear equations›']);
 await page.reload();await expect(middle.locator('.scope-cards-heading h3')).toHaveText('Matrices and Determinants');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('a fresh NDA maths view opens its taxonomy folder',async({page})=>{
 await page.goto('/prepare/NDA?view=nda-maths');
 await expect(page.locator('.scope-library-browser .scope-cards-heading h3')).toHaveText('Mathematics');
 await expect(page.locator('.scope-library-browser .scope-card-number')).toHaveText(['Section 1']);
 await expect(page.getByRole('button',{name:'Open NDA Mathematics',exact:true})).toBeVisible();
});
