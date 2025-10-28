const puppeteer = require('puppeteer');

async function testWorkspaceLoading() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Enable network logging
  page.on('request', request => {
    console.log('REQUEST:', request.url());
  });
  
  page.on('response', response => {
    console.log('RESPONSE:', response.url(), response.status());
  });
  
  try {
    // Navigate to login page first
    await page.goto('http://localhost:5174/login');
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Fill login form
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ timeout: 10000 });
    
    // Try to navigate to a workspace
    await page.goto('http://localhost:5174/c/twsbp/dashboard');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'workspace-loading-test.png' });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testWorkspaceLoading();