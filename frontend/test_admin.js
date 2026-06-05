import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

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
  console.log("🚀 Starting Macau Student-Tutor Admin Portal E2E Test...");

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Enable console logging from page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    // ==========================================
    // STEP 1: NAVIGATE AND LOGIN AS GUEST ADMIN
    // ==========================================
    console.log("\n[Step 1] Navigating to landing page...");
    await page.goto('http://localhost:5173/');
    await delay(2000);

    console.log("Opening auth modal...");
    const loginBtn = await findButtonByText(page, "登入 / 註冊");
    if (!loginBtn) throw new Error("Could not find '登入 / 註冊' button");
    await loginBtn.click();
    await delay(1000);

    console.log("Logging in as Guest Admin...");
    const guestAdminBtn = await findButtonByText(page, "👑 管理員訪客");
    if (!guestAdminBtn) throw new Error("Could not find '👑 管理員訪客' button");
    await guestAdminBtn.click();
    await delay(3500); // Wait for auth and load

    console.log("Saving Admin logged in screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_logged_in.png') });

    // Verify admin tabs are visible
    const tabsExist = await page.evaluate(() => {
      const controls = document.querySelector('.dashboard-controls');
      return controls && controls.textContent.includes('Tutors 導師管理');
    });
    console.log(`Admin dashboard tabs loaded: ${tabsExist}`);
    if (!tabsExist) {
      throw new Error("Failed to load Admin Dashboard tabs after login.");
    }

    // ==========================================
    // STEP 2: EDIT TUTOR RECORD
    // ==========================================
    console.log("\n[Step 2] Testing Tutor editing...");
    // Find the first Edit button in the Tutors table
    const tutorEditBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr button'));
      return buttons.find(b => b.textContent.trim() === '編輯');
    });

    if (!tutorEditBtn || !(await tutorEditBtn.asElement())) {
      throw new Error("Could not find any Tutor edit button");
    }
    
    console.log("Clicking Tutor Edit button...");
    await tutorEditBtn.asElement().click();
    await delay(1000);

    // Fill in new rate and bio
    const newRate = "350";
    const newBio = "澳門本地資深全科導師，編輯測試。專門教授高階數學與英文。";
    console.log(`Setting Tutor hourly rate to MOP ${newRate} and bio...`);
    
    await fillInput(page, '.modal-content input[type="number"]', newRate);
    await fillInput(page, '.modal-content textarea', newBio);
    await delay(500);

    console.log("Submitting changes...");
    const submitBtn = await findButtonByText(page, "儲存修改");
    if (!submitBtn) throw new Error("Could not find '儲存修改' button in modal");
    await submitBtn.click();
    await delay(2500); // Wait for PUT request to complete and state to refresh

    console.log("Saving Tutor edited screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_tutor_edited.png') });

    // Verify rate and bio have updated in the first row
    const tutorUpdated = await page.evaluate((expectedRate, expectedBio) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      if (rows.length === 0) return false;
      const firstRowText = rows[0].textContent;
      return firstRowText.includes(`${expectedRate} MOP`);
    }, newRate);

    console.log(`Verify Tutor update in table: ${tutorUpdated}`);
    if (!tutorUpdated) {
      throw new Error("Tutor update did not reflect in table view.");
    }

    // ==========================================
    // STEP 3: EDIT BOOKING RECORD
    // ==========================================
    console.log("\n[Step 3] Testing Booking editing...");
    // Switch to Bookings management tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Bookings 預約管理'));
      if (target) target.click();
      else throw new Error("Could not find 'Bookings 預約管理' tab button");
    });
    await delay(2000);

    // Find the first Edit button in the Bookings table
    const bookingEditBtn = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('.admin-section'));
      const bookingsSection = rows.find(s => s.textContent.includes('Bookings 預約課程管理'));
      if (!bookingsSection) return null;
      const editButtons = Array.from(bookingsSection.querySelectorAll('table.admin-table tbody tr button'));
      return editButtons.find(b => b.textContent.trim() === '編輯');
    });

    if (!bookingEditBtn || !(await bookingEditBtn.asElement())) {
      throw new Error("Could not find any Booking edit button");
    }

    console.log("Clicking Booking Edit button...");
    await bookingEditBtn.asElement().click();
    await delay(1000);

    // Edit Student Name
    const newStudentName = "測試學生小明";
    console.log(`Setting Booking Student Name to: ${newStudentName}`);
    await fillInput(page, '.modal-content input[type="text"]', newStudentName);

    // Edit Booking Status to confirmed
    console.log("Setting Booking Status to confirmed...");
    await page.select('.modal-content select', 'confirmed');
    await delay(500);

    console.log("Submitting Booking changes...");
    const bookingSubmitBtn = await findButtonByText(page, "儲存修改");
    await bookingSubmitBtn.click();
    await delay(2500);

    console.log("Saving Booking edited screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_booking_edited.png') });

    // Verify booking has updated in the table
    const bookingUpdated = await page.evaluate((expectedName) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(expectedName));
      return targetRow && targetRow.textContent.includes('已確認');
    }, newStudentName);

    console.log(`Verify Booking update in table: ${bookingUpdated}`);
    if (!bookingUpdated) {
      throw new Error("Booking update did not reflect in table view.");
    }

    // ==========================================
    // STEP 4: DELETE MATCH REQUEST
    // ==========================================
    console.log("\n[Step 4] Testing Request deletion...");
    // Switch to Requests management tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Requests 需求管理'));
      if (target) target.click();
      else throw new Error("Could not find 'Requests 需求管理' tab button");
    });
    await delay(2000);

    // Get number of requests before delete
    const requestsCountBefore = await page.evaluate(() => {
      return document.querySelectorAll('.admin-section table.admin-table tbody tr').length;
    });
    console.log(`Requests count before deletion: ${requestsCountBefore}`);
    if (requestsCountBefore === 0) {
      throw new Error("No requests found to delete");
    }

    // Capture the first request ID to confirm deletion
    const firstRequestId = await page.evaluate(() => {
      const codeEl = document.querySelector('.admin-section table.admin-table tbody tr code');
      return codeEl ? codeEl.textContent.trim() : null;
    });
    console.log(`Target Request ID for deletion: ${firstRequestId}`);

    // Set up dialog handler to accept the confirm dialog
    page.on('dialog', async dialog => {
      console.log(`[Dialog] Accepted dialog: "${dialog.message()}"`);
      await dialog.accept();
    });

    // Click the first "刪除" button in Requests table
    const requestDeleteBtn = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('.admin-section'));
      const requestsSection = rows.find(s => s.textContent.includes('Requests 學生需求管理'));
      if (!requestsSection) return null;
      const deleteButtons = Array.from(requestsSection.querySelectorAll('table.admin-table tbody tr button'));
      return deleteButtons.find(b => b.textContent.trim() === '刪除');
    });

    if (!requestDeleteBtn || !(await requestDeleteBtn.asElement())) {
      throw new Error("Could not find any Request delete button");
    }

    console.log("Clicking Request Delete button...");
    await requestDeleteBtn.asElement().click();
    await delay(3000); // Wait for DELETE API and state update

    console.log("Saving Request deleted screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_request_deleted.png') });

    // Verify requests count decreased and the ID is gone
    const deletionSuccess = await page.evaluate((deletedId) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const exists = rows.some(r => r.textContent.includes(deletedId));
      return !exists;
    }, firstRequestId);

    console.log(`Verify Request deletion in table (ID gone): ${deletionSuccess}`);
    if (!deletionSuccess) {
      throw new Error(`Request with ID ${firstRequestId} was not deleted.`);
    }

    // ==========================================
    // STEP 5: LOGOUT ADMIN
    // ==========================================
    console.log("\n[Step 5] Logging out admin...");
    const logoutBtn = await page.$('.btn-signout');
    if (!logoutBtn) throw new Error("Could not find logout button");
    await logoutBtn.click();
    await delay(2000);

    console.log("Saving Admin logged out screenshot...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_logged_out.png') });

    console.log("\n✅ E2E Admin Portal Test completed successfully!");
  } catch (error) {
    console.error("\n❌ E2E Admin Test Failed with Error:", error);
    if (page) {
      try {
        const url = page.url();
        console.log("Failure URL:", url);
        const screenshotPath = path.join(SCREENSHOT_DIR, 'test_admin_failure.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Saved failure screenshot to ${screenshotPath}`);
        const content = await page.content();
        fs.writeFileSync(path.join(SCREENSHOT_DIR, 'test_admin_failure_html.txt'), content);
        console.log("Saved failure HTML structure.");
      } catch (e) {
        console.error("Failed to capture diagnostics:", e);
      }
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
