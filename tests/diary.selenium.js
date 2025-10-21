import 'chromedriver';
import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import dotenv from 'dotenv';
dotenv.config();

async function runDiaryTest() {
  const options = new chrome.Options();
  // options.addArguments('--headless'); // Uncomment to run headless

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    // 1️⃣ Open login page
    await driver.get('http://localhost:5173/login');

    // 2️⃣ Login using .env credentials
    await driver.findElement(By.name('email')).sendKeys(process.env.TEST_EMAIL);
    await driver.findElement(By.name('password')).sendKeys(process.env.TEST_PASSWORD, Key.RETURN);

    // 3️⃣ Wait for dashboard to load
    await driver.wait(
      until.urlContains('/dashboard'),
      15000
    );
    console.log('Dashboard loaded!');

    // 4️⃣ Click Diary in navbar (use actual text from your navbar)
    const diaryLink = await driver.wait(
      until.elementLocated(By.xpath('//a[contains(text(), "Diary")]')),
      10000
    );
    await diaryLink.click();

    // 5️⃣ Wait for Diary page to load
    await driver.wait(
      until.urlContains('/diary'),
      10000
    );
    console.log('Diary page loaded successfully!');

    // 6️⃣ Add a diary entry
    const textarea = await driver.wait(
      until.elementLocated(By.css('textarea[name="entry"]')),
      10000
    );
    await textarea.sendKeys('This is a Selenium test diary entry.');

    const saveBtn = await driver.findElement(By.css('button[type="submit"]'));
    await saveBtn.click();

    console.log('Diary entry added successfully!');
  } catch (err) {
    console.error('Error in diary Selenium test:', err);
  } finally {
    await driver.quit();
  }
}

runDiaryTest();
