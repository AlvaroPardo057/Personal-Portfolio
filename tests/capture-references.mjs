import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:1600,height:2464}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5175/tests/reference-review.html');await page.waitForFunction(()=>window.referenceReview);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  await page.screenshot({path:'test-results/reference-comparison.jpg',type:'jpeg',quality:85});
  for(const [i,id] of ['f1','power-plant','library','notebook','bike','phone'].entries())await page.screenshot({path:`test-results/reference-${id}.jpg`,type:'jpeg',quality:88,clip:{x:0,y:64+i*400,width:1600,height:400}});
  console.log(JSON.stringify({errors,models:await page.evaluate(()=>window.referenceReview.scenes.map(s=>s.id))}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
