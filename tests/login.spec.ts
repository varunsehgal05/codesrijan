import { test, expect } from '@playwright/test';
const URL=process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
for(const role of ['admin','student','invalid']){
 test(`admin login form handles ${role}`,async({page})=>{
  const user={id:'qa-login-fixture',name:'QA Fixture',email:'qa-login@example.invalid',role};
  let submitted=false;
  await page.route('https://identitytoolkit.googleapis.com/**',r=>r.fulfill({status:400,json:{error:{message:'INVALID_LOGIN_CREDENTIALS'}}}));
  await page.route('**/api/**',async r=>{
   const path=new URLSearchParams(); void path;
   if(r.request().url().endsWith('/auth/login')){
    const body=r.request().postDataJSON();
    expect(body.email).toBe(user.email);
    expect(body.password).toBe('Isolated-QA-Only-Login!');
    submitted=true;
    return r.fulfill(role==='invalid'?{status:401,json:{message:'Invalid credentials'}}:{json:{user,token:'isolated-qa-fixture-token'}});
   }
   return r.fulfill({json:r.request().url().endsWith('/auth/me')?{user}:[]});
  });
  await page.goto(`${URL}/admin-login`,{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button',{name:'Open SrijanBot help'})).toBeEnabled({timeout:20000});
  await page.locator('input').first().fill(user.email);
  await page.locator('input[type=password]').fill('Isolated-QA-Only-Login!');
  await page.locator('form button[type=submit]').click();
  if(role==='invalid') await expect(page.getByText('[!] Invalid credentials')).toBeVisible();
  else await expect(page).toHaveURL(new RegExp(role==='admin'?'/admin$':'/dashboard$'));
  expect(submitted).toBe(true);
 });
}

