import {expect,test} from '@playwright/test';

test('PYQ trends filters exam, paper, year and term from real catalogue data',async({page})=>{
 await page.goto('/trends');
 await expect(page.getByRole('heading',{name:'PYQ Trends'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Trends',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'NDA · GAT · English'})).toBeVisible();
 await expect(page.getByRole('group',{name:'GAT section'})).toBeVisible();
 await page.getByRole('button',{name:'Science',exact:true}).click();
 await expect(page.getByRole('heading',{name:'NDA · GAT · Science'})).toBeVisible();
 await page.getByRole('button',{name:'GS',exact:true}).click();
 await expect(page.getByRole('heading',{name:'NDA · GAT · GS'})).toBeVisible();
 const table=page.getByRole('table');
 await expect(table).toBeVisible();
 await expect(table.locator('thead')).toContainText('I');await expect(table.locator('thead')).toContainText('II');
 await page.getByRole('button',{name:'CDS',exact:true}).click();
 await expect(page.getByRole('heading',{name:'CDS · General Knowledge'})).toBeVisible();
 await expect(page.getByRole('group',{name:'GAT section'})).toBeHidden();
 await page.getByRole('button',{name:'Last 5',exact:true}).click();
 await expect(page.getByText('5',{exact:true}).last()).toBeVisible();
 await page.getByRole('button',{name:'CSE',exact:true}).click();
 await expect(page.getByRole('heading',{name:'CSE · GS Paper I'})).toBeVisible();
 await expect(table.locator('thead')).toContainText('Questions');
 await expect(table.getByRole('link',{name:'Open in library →'}).first()).toBeVisible();
});
