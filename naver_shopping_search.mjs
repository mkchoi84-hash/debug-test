import { chromium } from 'playwright';

const QUERY = '러프웨어 Ridgeline Magnetic Harness';

(async () => {
  const browser = await chromium.launch({ headless: false }); // 브라우저 창이 뜹니다
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(QUERY)}`;
  console.log('접속 중:', url);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 스크린샷 저장
  await page.screenshot({ path: 'naver_result.png', fullPage: false });
  console.log('스크린샷 저장됨: naver_result.png');

  // 최저가 추출
  const items = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('[class*="product_item"], [class*="basicList_item"]');
    cards.forEach((card, i) => {
      if (i >= 10) return;
      const name = card.querySelector('[class*="name"]')?.innerText?.trim();
      const price = card.querySelector('[class*="price_num"], [class*="price"]')?.innerText?.trim();
      const mall = card.querySelector('[class*="mall_name"], [class*="seller"]')?.innerText?.trim();
      if (name || price) results.push({ name, price, mall });
    });
    return results;
  });

  console.log('\n=== 검색 결과 ===');
  items.forEach((item, i) => {
    console.log(`\n[${i + 1}] ${item.name}`);
    console.log(`    가격: ${item.price}`);
    console.log(`    판매처: ${item.mall}`);
  });

  // 판매자 수 확인 (최저가 비교 페이지)
  const firstLink = await page.$('[class*="product_item"] a, [class*="basicList_item"] a');
  if (firstLink) {
    await firstLink.click();
    const pages = await context.pages();
    const productPage = pages[pages.length - 1];
    await productPage.waitForTimeout(3000);

    const sellerCount = await productPage.evaluate(() => {
      const countEl = document.querySelector('[class*="seller_count"], [class*="mall_count"]');
      return countEl?.innerText?.trim();
    });
    if (sellerCount) console.log('\n판매자 수:', sellerCount);

    await productPage.screenshot({ path: 'naver_product.png' });
    console.log('상품 페이지 스크린샷 저장됨: naver_product.png');
  }

  await browser.close();
})();
