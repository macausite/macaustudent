import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const SCREENSHOT_DIR = '/Users/roberto/.gemini/antigravity/brain/14aa1da8-6305-48d0-a331-fcf0514d485f';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findButtonByText(page, text) {
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const value = await page.evaluate(el => el.textContent, button);
    if (value.trim().includes(text)) {
      return button;
    }
  }
  return null;
}

async function fillInput(page, selector, text) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (el, val) => {
    const prototype = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    setter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, text);
  await delay(100);
}

(async () => {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@example.com`;
  const tutorEmail = `tutor_${timestamp}@example.com`;
  const studentName = `學生_${timestamp}`;
  const tutorName = `導師_Ryan_${timestamp}`;
  const password = "password123";

  console.log("🚀 Starting Macau Student-Tutor Integration Flow Test...");
  console.log(`Generated Test Accounts:\n - Student: ${studentEmail}\n - Tutor: ${tutorEmail}`);

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Enable request interception to capture outgoing auth requests
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.includes('identitytoolkit') || url.includes('signUp') || url.includes('accounts')) {
        console.log('OUTGOING AUTH REQUEST URL:', url);
      }
      request.continue();
    });

    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    // ==========================================
    // STEP 1: REGISTER TEST STUDENT
    // ==========================================
    console.log("\n[Step 1] Navigating to landing page to register student...");
    await page.goto('http://localhost:5173/');
    await delay(2000);

    console.log("Opening auth modal...");
    const loginBtn = await findButtonByText(page, "登入 / 註冊");
    if (!loginBtn) throw new Error("Could not find '登入 / 註冊' button");
    await loginBtn.click();
    await delay(1000);

    console.log("Toggling to Signup Mode...");
    const signupToggle = await page.$('.auth-toggle-link');
    if (!signupToggle) throw new Error("Could not find signup toggle link");
    await signupToggle.click();
    await delay(500);

    console.log("Filling in student registration fields...");
    await fillInput(page, '.auth-form input[type="text"]', studentName);
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);

    // Select Student radio (value === 'student')
    const studentRadio = await page.$('input[value="student"]');
    if (studentRadio) {
      await studentRadio.click();
    } else {
      console.warn("Could not find student radio input, defaulting to student role");
    }
    await delay(500);

    console.log("Submitting Student signup form...");
    const submitBtn = await page.$('.btn-auth-submit');
    await submitBtn.click();
    await delay(6000); // Wait longer for state update / emulator response

    console.log("Saving Student registered screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_student_registered.png') });

    console.log("Checking if user is logged in...");
    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector('.btn-signout');
    });
    console.log(`Is Logged In (has logout button)? ${isLoggedIn}`);
    if (!isLoggedIn) {
      const html = await page.content();
      console.log("Page Content on failure:\n", html);
      throw new Error("Could not log in student");
    }

    console.log("Logging out student account...");
    const logoutBtn = await page.$('.btn-signout');
    await logoutBtn.click();
    await delay(2000);

    // ==========================================
    // STEP 2: REGISTER TEST TUTOR & CREATE PROFILE
    // ==========================================
    console.log("\n[Step 2] Opening auth modal to register tutor...");
    const loginBtnTutor = await findButtonByText(page, "登入 / 註冊");
    await loginBtnTutor.click();
    await delay(1000);

    console.log("Toggling to Signup Mode...");
    const signupToggleTutor = await page.$('.auth-toggle-link');
    await signupToggleTutor.click();
    await delay(500);

    console.log("Filling in tutor registration fields...");
    await fillInput(page, '.auth-form input[type="text"]', tutorName);
    await fillInput(page, '.auth-form input[type="email"]', tutorEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);

    // Select Tutor radio (value === 'tutor')
    const tutorRadio = await page.$('input[value="tutor"]');
    if (tutorRadio) {
      await tutorRadio.click();
    } else {
      throw new Error("Could not find tutor radio input");
    }
    await delay(500);

    const values = await page.evaluate(() => {
      return {
        name: document.querySelector('.auth-form input[type="text"]')?.value,
        email: document.querySelector('.auth-form input[type="email"]')?.value,
        password: document.querySelector('.auth-form input[type="password"]')?.value,
        role: document.querySelector('input[name="authRole"]:checked')?.value
      };
    });
    console.log("Form values before submit:", values);

    console.log("Submitting Tutor signup form...");
    const submitBtnTutor = await page.$('.btn-auth-submit');
    await submitBtnTutor.click();
    await delay(5000);

    console.log("Checking if tutor is logged in...");
    const isLoggedInTutor = await page.evaluate(() => {
      return !!document.querySelector('.btn-signout');
    });
    console.log(`Is Logged In (has logout button)? ${isLoggedInTutor}`);
    if (!isLoggedInTutor) {
      throw new Error("Could not log in tutor");
    }

    console.log("Tutor logged in. Now filling onboarding profile details...");
    // Quals
    await fillInput(page, 'input[placeholder="例如: 澳門大學數學系學士"]', "澳門大學英語教學碩士");

    // Rate
    await fillInput(page, 'input[placeholder="e.g. 300"]', "280");

    // Location (Peninsula)
    await page.select('.note-form select', 'Macau Peninsula');

    // Subjects checkboxes (English is index 4)
    const subjectCheckboxes = await page.$$('.checkbox-grid input[type="checkbox"]');
    await subjectCheckboxes[4].click(); // English

    // Curriculums checkboxes (International System is index 1 of all checkboxes in form)
    const allCheckboxes = await page.$$('.note-form input[type="checkbox"]');
    await allCheckboxes[1].click();

    // Bio
    const bioTextarea = await page.$('.note-form textarea');
    await bioTextarea.type("資深英文輔導老師，熟習國際學制，專注口語及文法寫作提升。");
    await delay(500);

    console.log("Publishing tutor profile...");
    const publishBtn = await findButtonByText(page, "發佈導師檔案");
    await publishBtn.click();
    await delay(2500);

    console.log("Saving Tutor profile created screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_tutor_profile_created.png') });

    console.log("Logging out tutor account...");
    const logoutBtnTutor = await page.$('.btn-signout');
    await logoutBtnTutor.click();
    await delay(2000);

    // ==========================================
    // STEP 3: STUDENT LOGS IN & MAKES A BOOKING
    // ==========================================
    console.log("\n[Step 3] Logging in as student to book a slot...");
    const loginBtnStudent2 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnStudent2.click();
    await delay(1000);

    console.log("Filling student login details...");
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);

    console.log("Submitting student login...");
    const submitLoginStudent = await page.$('.btn-auth-submit');
    await submitLoginStudent.click();
    await delay(3500);

    console.log(`Finding the newly registered tutor (${tutorName})...`);
    // Filter by English subject to isolate
    await page.select('.section-header select', 'English');
    await delay(1000);

    // Find card with tutorName
    const cards = await page.$$('.card');
    let targetCard = null;
    for (const card of cards) {
      const text = await page.evaluate(el => el.textContent, card);
      if (text.includes(tutorName)) {
        targetCard = card;
        break;
      }
    }

    if (!targetCard) throw new Error("Could not find registered tutor card on the explorer directory");

    console.log("Selecting slot and booking on tutor card...");
    // Within the card, click Book session
    const bookBtnOnCard = await targetCard.$('.btn-book');
    await bookBtnOnCard.click();
    await delay(3000); // Wait for booking post response

    console.log("Navigating to My Bookings tab...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('我的預約狀態'));
      if (target) {
        target.click();
      } else {
        throw new Error("Could not find '我的預約狀態' button in DOM");
      }
    });
    await delay(2000);

    console.log("Saving Student booking status screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_booking_made.png') });

    console.log("Logging out student...");
    const logoutBtnStudent3 = await page.$('.btn-signout');
    await logoutBtnStudent3.click();
    await delay(2000);

    // ==========================================
    // STEP 4: TUTOR LOGS IN & ACCEPTS BOOKING
    // ==========================================
    console.log("\n[Step 4] Logging in as tutor to accept the booking...");
    const loginBtnTutor2 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnTutor2.click();
    await delay(1000);

    console.log("Filling tutor login details...");
    await fillInput(page, '.auth-form input[type="email"]', tutorEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);

    console.log("Submitting tutor login...");
    const submitLoginTutor = await page.$('.btn-auth-submit');
    await submitLoginTutor.click();
    await delay(3500);

    console.log("Navigating to Received Bookings tab...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('收到的預約申請'));
      if (target) {
        target.click();
      } else {
        throw new Error("Could not find '收到的預約申請' button in DOM");
      }
    });
    await delay(2000);

    console.log("Accepting the booking request...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent.includes('確認預約'));
      if (target) {
        target.click();
      } else {
        throw new Error("Could not find '確認預約' button in DOM");
      }
    });
    await delay(2500);

    console.log("Saving Tutor booking accepted screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_booking_accepted.png') });

    console.log("\n✅ Integration Flow Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test Failed with Error:", error);
    if (page) {
      try {
        const url = page.url();
        console.log("Failure URL:", url);
        const screenshotPath = path.join(SCREENSHOT_DIR, 'test_failure.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Saved failure screenshot to ${screenshotPath}`);
        const content = await page.content();
        fs.writeFileSync(path.join(SCREENSHOT_DIR, 'test_failure_html.txt'), content);
        console.log("Saved failure HTML structure.");
      } catch (e) {
        console.error("Failed to capture diagnostics:", e);
      }
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
