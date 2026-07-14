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
  const timestamp = Date.now();
  const studentEmail = `stu_${timestamp}@example.com`;
  const tutorEmail = `tut_${timestamp}@example.com`;
  const studentName = `學生小明_${timestamp}`;
  const tutorName = `導師陳先生_${timestamp}`;
  const password = "password123";

  console.log("🚀 Starting Comprehensive Features E2E Test (with Tutor Verification)...");
  console.log(`Generated Test Accounts:\n - Student: ${studentEmail}\n - Tutor: ${tutorEmail}`);

  // Reset database before launching browser
  console.log("Resetting backend database via Node.js fetch...");
  try {
    const res = await fetch('http://127.0.0.1:5001/demo-macaustudent/us-central1/api/reset', { method: 'POST' });
    const data = await res.json();
    console.log("Database reset status:", data);
  } catch (err) {
    console.error("Failed to reset database via Node.js fetch:", err);
  }

  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });
    await page.setCacheEnabled(false);

    // Enable console logging from page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    // ==========================================
    // STEP 1: PUBLIC DIRECTORY EXPLORER & FILTERING
    // ==========================================
    console.log("\n[Step 1] Testing Public Explorer & Filtering...");
    await page.goto('http://localhost:5173/');
    await delay(2000);

    // Verify rebranded title
    const pageTitle = await page.title();
    console.log(`Page Title: "${pageTitle}"`);
    if (pageTitle !== "澳門學生網 | Macau Student Hub") {
      throw new Error(`Expected page title to be "澳門學生網 | Macau Student Hub", but got: "${pageTitle}"`);
    }

    // Verify favicon links
    const faviconHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel*="icon"]');
      return link ? link.getAttribute('href') : null;
    });
    console.log(`Favicon href: ${faviconHref}`);
    if (!faviconHref || !faviconHref.includes('student-icon.svg')) {
      throw new Error(`Expected favicon link to include 'student-icon.svg', but got: ${faviconHref}`);
    }

    // Verify navbar logo text and icon
    const logoImgExists = await page.evaluate(() => !!document.querySelector('.logo img[src="/student-icon.svg"]'));
    const navbarBrand = await page.evaluate(() => {
      const brand = document.querySelector('.logo');
      return brand ? brand.textContent.trim() : null;
    });
    console.log(`Navbar Brand: "${navbarBrand}", logo img exists: ${logoImgExists}`);
    if (!navbarBrand || !navbarBrand.includes('澳門學生網') || !logoImgExists) {
      throw new Error(`Navbar Brand expected to contain '澳門學生網' and logo image, but got: "${navbarBrand}" with logoImgExists: ${logoImgExists}`);
    }

    // Take screenshot of default landing page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_1_landing_page.png') });

    // Filter by Math
    console.log("Filtering tutors by subject Math...");
    await page.select('.section-header select', 'Math');
    await delay(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_2_filtered_tutors.png') });

    // Switch filters back to all
    await page.select('.section-header select', 'all');
    await delay(500);

    // ==========================================
    // STEP 2: REGISTER STUDENT & POST MATCH REQUEST
    // ==========================================
    console.log("\n[Step 2] Registering student & posting a match request...");
    const loginBtn = await findButtonByText(page, "登入 / 註冊");
    await loginBtn.click();
    await delay(1000);

    // Toggle to Sign Up mode
    const signupToggle = await page.$('.auth-toggle-link');
    await signupToggle.click();
    await delay(500);

    // Register Student
    await fillInput(page, '.auth-form input[placeholder="例如: 蘇老師"]', studentName);
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const studentRadio = await page.$('input[value="student"]');
    if (studentRadio) await studentRadio.click();
    await delay(500);

    const submitBtn = await page.$('.btn-auth-submit');
    await submitBtn.click();
    await delay(5000);

    console.log("Checking if student logged in successfully...");
    const isLoggedInStudent = await page.evaluate(() => !!document.querySelector('.btn-signout'));
    if (!isLoggedInStudent) throw new Error("Student login failed");

    // Post match request
    console.log("Posting matching request...");
    // Navigating to requests tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('需求配對板'));
      if (target) target.click();
      else throw new Error("Could not find '需求配對板' button");
    });
    await delay(1000);

    const matchReqTitle = `尋找高一英文家教_${timestamp}`;
    await fillInput(page, '.note-form input[placeholder="例如: 四校聯考數學科急需輔導"]', matchReqTitle);
    await page.select('.note-form select', 'English');
    await fillInput(page, '.note-form input[type="number"]', '320');
    await fillInput(page, '.note-form textarea', '希望導師有多年國際學校（IB/IGCSE）教學經驗，能輔導高一英文寫作與口語提升。');
    await delay(500);

    console.log("Submitting match request...");
    const submitReqBtn = await page.$('.note-form button.btn-submit');
    await submitReqBtn.click();
    await delay(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_3_student_posted_request.png') });

    // Verify request is posted on board
    const requestOnBoard = await page.evaluate((title) => {
      const notes = Array.from(document.querySelectorAll('.notes-grid .note-card'));
      return notes.some(n => n.textContent.includes(title));
    }, matchReqTitle);
    console.log(`Verify request on board: ${requestOnBoard}`);
    if (!requestOnBoard) throw new Error("Request did not appear on matching board");

    // Log out student
    console.log("Logging out student...");
    const logoutBtn = await page.$('.btn-signout');
    await logoutBtn.click();
    await delay(2000);

    // ==========================================
    // STEP 3: REGISTER TUTOR & PROFILE ONBOARDING (PENDING APPROVAL)
    // ==========================================
    console.log("\n[Step 3] Registering tutor & creating profile onboarding...");
    const loginBtnTutor = await findButtonByText(page, "登入 / 註冊");
    await loginBtnTutor.click();
    await delay(1000);

    // Toggle to Sign Up mode
    const signupToggleTutor = await page.$('.auth-toggle-link');
    await signupToggleTutor.click();
    await delay(500);

    // Register Tutor
    await fillInput(page, '.auth-form input[placeholder="例如: 蘇老師"]', tutorName);
    await fillInput(page, '.auth-form input[type="email"]', tutorEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const tutorRadio = await page.$('input[value="tutor"]');
    if (tutorRadio) await tutorRadio.click();
    await delay(500);

    const submitBtnTutor = await page.$('.btn-auth-submit');
    await submitBtnTutor.click();
    await delay(5000);

    console.log("Tutor logged in. Now onboarding details...");
    await fillInput(page, 'input[placeholder="例如: 澳門大學數學系學士"]', "聖若瑟大學英語教學碩士");
    await fillInput(page, 'input[placeholder="e.g. 300"]', "300");
    await page.select('.note-form select', 'Taipa');

    // Subjects checkboxes (English is index 4)
    const subjectCheckboxes = await page.$$('.checkbox-grid input[type="checkbox"]');
    await subjectCheckboxes[4].click(); // English

    // Curriculums checkboxes (International System is index 1)
    const allCheckboxes = await page.$$('.note-form input[type="checkbox"]');
    await allCheckboxes[1].click();

    // Bio
    const bioTextarea = await page.$('.note-form textarea');
    await bioTextarea.type("全職英文家教，5年國際學校教學背景，擅長寫作、會話及IB/IGCSE課程對接。");
    await delay(500);

    console.log("Publishing tutor profile...");
    const publishBtn = await findButtonByText(page, "發佈導師檔案");
    await publishBtn.click();
    await delay(2500);

    console.log("Checking if tutor dashboard warning banner is displayed...");
    const bannerVisible = await page.evaluate(() => {
      const banner = document.querySelector('.verification-warning-banner');
      return banner && banner.textContent.includes('審核中');
    });
    console.log(`Warning banner visible: ${bannerVisible}`);
    if (!bannerVisible) throw new Error("Verification pending warning banner was not displayed on new tutor's dashboard");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_4_tutor_onboarded.png') });

    // Log out tutor
    const logoutBtnTutor = await page.$('.btn-signout');
    await logoutBtnTutor.click();
    await delay(2000);

    // ==========================================
    // STEP 4: STUDENT LOGIN & CHECK TUTOR INVISIBILITY BEFORE APPROVAL
    // ==========================================
    console.log("\n[Step 4] Student logging in and verifying tutor is not visible yet...");
    const loginBtnStudent2 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnStudent2.click();
    await delay(1000);

    // Student Login
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const submitLoginStudent = await page.$('.btn-auth-submit');
    await submitLoginStudent.click();
    await delay(3500);

    // Find tutor (should be invisible)
    console.log(`Verifying tutor ${tutorName} is NOT visible in explorer...`);
    await page.select('.section-header select', 'English');
    await delay(1000);

    const cardsBeforeApproval = await page.$$('.card');
    let foundTutorBeforeApproval = false;
    for (const card of cardsBeforeApproval) {
      const text = await page.evaluate(el => el.textContent, card);
      if (text.includes(tutorName)) {
        foundTutorBeforeApproval = true;
        break;
      }
    }
    console.log(`Tutor visible before approval? ${foundTutorBeforeApproval}`);
    if (foundTutorBeforeApproval) {
      throw new Error("Tutor profile was visible in student explorer prior to admin approval");
    }

    // Log out student
    const logoutBtnStudentBefore = await page.$('.btn-signout');
    await logoutBtnStudentBefore.click();
    await delay(2000);

    // ==========================================
    // STEP 5: ADMIN APPROVES TUTOR
    // ==========================================
    console.log("\n[Step 5] Admin logging in to approve tutor...");
    const loginBtnAdmin = await findButtonByText(page, "登入 / 註冊");
    await loginBtnAdmin.click();
    await delay(1000);

    // Guest Admin Quick Login
    const guestAdminBtn = await findButtonByText(page, "👑 管理員訪客");
    await guestAdminBtn.click();
    await delay(3500);

    // Navigate to Tutors tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Tutors 導師管理'));
      if (target) target.click();
      else throw new Error("Could not find 'Tutors 導師管理' button");
    });
    await delay(2000);

    console.log(`Approving tutor ${tutorName} in Admin Portal...`);
    const approveBtn = await page.evaluateHandle((targetName) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(targetName));
      if (!targetRow) return null;
      const buttons = Array.from(targetRow.querySelectorAll('button'));
      return buttons.find(b => b.textContent.trim() === '核准');
    }, tutorName);

    if (!approveBtn || !(await approveBtn.asElement())) {
      throw new Error(`Could not find '核准' button for tutor ${tutorName}`);
    }
    await approveBtn.asElement().click();
    await delay(3000); // Wait for API response

    // Take screenshot of approved tutor table
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_5_admin_approved_tutor.png') });

    // Verify Approved status in table
    const statusApproved = await page.evaluate((targetName) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(targetName));
      return targetRow && targetRow.textContent.includes('已認證');
    }, tutorName);
    console.log(`Tutor status is Approved in table: ${statusApproved}`);
    if (!statusApproved) throw new Error("Tutor status did not update to '已認證' in Admin Portal table");

    // Logout Admin
    const logoutAdminBtn = await page.$('.btn-signout');
    await logoutAdminBtn.click();
    await delay(2000);

    // ==========================================
    // STEP 6: STUDENT BOOKS SESSION (TUTOR NOW VISIBLE)
    // ==========================================
    console.log("\n[Step 6] Student logging back in to book slot on approved tutor...");
    const loginBtnStudent3 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnStudent3.click();
    await delay(1000);

    // Student Login
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const submitLoginStudent2 = await page.$('.btn-auth-submit');
    await submitLoginStudent2.click();
    await delay(3500);

    // Find the newly registered tutor (now visible!)
    console.log(`Locating tutor ${tutorName}...`);
    await page.select('.section-header select', 'English');
    await delay(1000);

    const cardsAfterApproval = await page.$$('.card');
    let targetCard = null;
    for (const card of cardsAfterApproval) {
      const text = await page.evaluate(el => el.textContent, card);
      if (text.includes(tutorName)) {
        targetCard = card;
        break;
      }
    }

    if (!targetCard) throw new Error("Could not find the approved tutor in student explorer search results");

    console.log("Booking session on tutor card...");
    const bookBtnOnCard = await targetCard.$('.btn-book');
    await bookBtnOnCard.click();
    await delay(3000);

    // Navigate to My Bookings tab and check the count is correct
    console.log("Navigating to student's My Bookings tab...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('我的預約狀態'));
      if (target) target.click();
      else throw new Error("Could not find '我的預約狀態' button");
    });
    await delay(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_6_student_my_bookings.png') });

    // Verify booking count displays as (1)
    const bookingCountString = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('我的預約狀態'));
      return target ? target.textContent.trim() : "";
    });
    console.log(`Booking Tab Text: "${bookingCountString}"`);
    if (!bookingCountString.includes('(1)')) {
      throw new Error(`Expected booking count to be (1) for this student, but got "${bookingCountString}"`);
    }

    // Log out student
    const logoutBtnStudent3 = await page.$('.btn-signout');
    await logoutBtnStudent3.click();
    await delay(2000);

    // ==========================================
    // STEP 7: TUTOR ACCEPTANCE
    // ==========================================
    console.log("\n[Step 7] Tutor logging in to accept booking...");
    const loginBtnTutor2 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnTutor2.click();
    await delay(1000);

    // Tutor Login
    await fillInput(page, '.auth-form input[type="email"]', tutorEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const submitLoginTutor = await page.$('.btn-auth-submit');
    await submitLoginTutor.click();
    await delay(3500);

    // Navigate to Received Bookings tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('收到的預約申請'));
      if (target) target.click();
      else throw new Error("Could not find '收到的預約申請' button");
    });
    await delay(2000);

    // Accept booking
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find(b => b.textContent.includes('確認預約'));
      if (target) target.click();
      else throw new Error("Could not find '確認預約' button");
    });
    await delay(2500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_7_tutor_accepted_booking.png') });

    // Log out tutor
    const logoutBtnTutor2 = await page.$('.btn-signout');
    await logoutBtnTutor2.click();
    await delay(2000);

    // ==========================================
    // STEP 8: ADMIN CRUD OPERATIONS
    // ==========================================
    console.log("\n[Step 8] Logging in as Admin to test full CRUD and delete request...");
    const loginBtnAdmin2 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnAdmin2.click();
    await delay(1000);

    // Guest Admin Quick Login
    const guestAdminBtn2 = await findButtonByText(page, "👑 管理員訪客");
    await guestAdminBtn2.click();
    await delay(3500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_8_admin_dashboard.png') });

    // Test Platform Global Settings (Admin)
    console.log("Updating platform global settings...");
    await fillInput(page, '#commissionInput', '3');
    await fillInput(page, '#announcementInput', '澳門學生網系統升級維護通知');
    
    console.log("Enabling SMS Verification toggle...");
    await page.evaluate(() => {
      const toggle = document.querySelector('#smsVerificationToggle');
      if (toggle && !toggle.checked) {
        toggle.click();
      }
    });

    console.log("Inputting mock google tracking script...");
    const mockScript = '<script>window.testTrackingLoaded = true;</script>';
    await fillInput(page, '#trackingScriptInput', mockScript);

    const saveSettingsBtn = await findButtonByText(page, "儲存全局設定");
    if (!saveSettingsBtn) throw new Error("Could not find '儲存全局設定' button");
    await saveSettingsBtn.click();
    await delay(2000);

    // Check if script is injected and executed immediately
    const testTrackingLoaded = await page.evaluate(() => window.testTrackingLoaded);
    console.log(`Verify tracking script executed immediately: ${testTrackingLoaded}`);
    if (testTrackingLoaded !== true) {
      throw new Error("Google Tracking Script was not dynamically injected and executed upon saving settings");
    }

    // ==========================================
    // STEP 8.5: TEST SMS VERIFICATION REGISTRATION FLOW
    // ==========================================
    console.log("\n[Step 8.5] Testing SMS Verification flow...");
    
    // Log out Admin
    const logoutAdminBtnSettings = await page.$('.btn-signout');
    await logoutAdminBtnSettings.click();
    await delay(2000);

    // Open Register modal
    const loginBtnSMS = await findButtonByText(page, "登入 / 註冊");
    await loginBtnSMS.click();
    await delay(1000);

    // Toggle to Sign Up mode
    const signupToggleSMS = await page.$('.auth-toggle-link');
    await signupToggleSMS.click();
    await delay(500);

    // Assert that the phone input field is visible
    const phoneInputVisible = await page.evaluate(() => !!document.querySelector('#authPhoneInput'));
    console.log(`Phone input visible: ${phoneInputVisible}`);
    if (!phoneInputVisible) {
      throw new Error("Phone input was not rendered when SMS Verification was enabled");
    }

    // Fill registration info
    const smsEmail = `sms_${timestamp}@example.com`;
    await fillInput(page, '.auth-form input[placeholder="例如: 蘇老師"]', `SMS驗證學生_${timestamp}`);
    await fillInput(page, '.auth-form input[type="email"]', smsEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    await fillInput(page, '#authPhoneInput', '66123456');
    await delay(500);

    // Click Send OTP
    console.log("Clicking Send OTP...");
    const sendOtpBtn = await page.$('#sendOtpBtn');
    await sendOtpBtn.click();
    await delay(2000);

    // Retrieve generated code from window context
    const devOtpCode = await page.evaluate(() => window.devOtpCode);
    console.log(`Retrieved Dev OTP Code: ${devOtpCode}`);
    if (!devOtpCode) {
      throw new Error("Dev OTP Code was not logged to page window context");
    }

    // Input verification code and click verify
    await fillInput(page, '#authOtpInput', devOtpCode);
    const verifyOtpBtn = await page.$('#verifyOtpBtn');
    await verifyOtpBtn.click();
    await delay(2000);

    // Check validation message
    const otpSuccessMessage = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('.auth-form div'));
      return divs.some(d => d.textContent.includes('驗證成功'));
    });
    console.log(`Verify OTP success message visible: ${otpSuccessMessage}`);
    if (!otpSuccessMessage) {
      throw new Error("OTP success message was not displayed after verification");
    }

    // Click signup button
    const submitBtnSMS = await page.$('.btn-auth-submit');
    await submitBtnSMS.click();
    await delay(5000);

    // Assert login succeeds
    const isLoggedInSMS = await page.evaluate(() => !!document.querySelector('.btn-signout'));
    console.log(`Logged in successfully after SMS signup? ${isLoggedInSMS}`);
    if (!isLoggedInSMS) {
      throw new Error("Registration with SMS verification failed");
    }

    // Log out new user
    const logoutBtnSMS = await page.$('.btn-signout');
    await logoutBtnSMS.click();
    await delay(2000);

    // Log back in as Admin to disable SMS verification
    console.log("Logging back in as Admin to disable SMS verification...");
    const loginBtnAdminBack = await findButtonByText(page, "登入 / 註冊");
    await loginBtnAdminBack.click();
    await delay(1000);

    const guestAdminBtnBack = await findButtonByText(page, "👑 管理員訪客");
    await guestAdminBtnBack.click();
    await delay(3500);

    // Disable SMS toggle
    console.log("Disabling SMS Verification toggle...");
    await page.evaluate(() => {
      const toggle = document.querySelector('#smsVerificationToggle');
      if (toggle && toggle.checked) {
        toggle.click();
      }
    });
    await delay(500);

    const saveSettingsBtnBack = await findButtonByText(page, "儲存全局設定");
    await saveSettingsBtnBack.click();
    await delay(2000);

    // Log out Admin
    const logoutAdminBtnFinalSMS = await page.$('.btn-signout');
    await logoutAdminBtnFinalSMS.click();
    await delay(2000);

    // Log in Admin again (Step 8 expects admin logged in for Tutors tab)
    console.log("Logging Admin back in for remaining Step 8 CRUD tests...");
    const loginBtnAdminCRUD = await findButtonByText(page, "登入 / 註冊");
    await loginBtnAdminCRUD.click();
    await delay(1000);
    const guestAdminBtnCRUD = await findButtonByText(page, "👑 管理員訪客");
    await guestAdminBtnCRUD.click();
    await delay(3500);

    // Navigate to Tutors tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Tutors 導師管理'));
      if (target) target.click();
      else throw new Error("Could not find 'Tutors 導師管理' button");
    });
    await delay(2000);

    // Edit Tutor details
    console.log("Editing tutor rate and checking verification toggle...");
    const tutorEditBtn = await page.evaluateHandle((targetName) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(targetName));
      if (!targetRow) return null;
      const editButtons = Array.from(targetRow.querySelectorAll('button'));
      return editButtons.find(b => b.textContent.trim() === '編輯');
    }, tutorName);
    await tutorEditBtn.asElement().click();
    await delay(1000);

    await fillInput(page, '.modal-content input[type="number"]', '380');
    const submitEditBtn = await findButtonByText(page, "儲存修改");
    await submitEditBtn.click();
    await delay(2500);

    // Edit Booking status
    console.log("Editing booking details via Admin Portal...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Bookings 預約管理'));
      if (target) target.click();
    });
    await delay(2000);

    const bookingEditBtn = await page.evaluateHandle(() => {
      const editButtons = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr button'));
      return editButtons.find(b => b.textContent.trim() === '編輯');
    });
    await bookingEditBtn.asElement().click();
    await delay(1000);

    await fillInput(page, '.modal-content input[type="text"]', studentName);
    // Select the booking status dropdown (the one containing 'completed')
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('.modal-content select'));
      const statusSelect = selects.find(sel => Array.from(sel.options).some(o => o.value === 'completed'));
      if (statusSelect) {
        statusSelect.value = 'completed';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error("Could not find status select");
      }
    });
    const submitBookingBtn = await findButtonByText(page, "儲存修改");
    await submitBookingBtn.click();
    await delay(2500);

    // ----------------------------------------------------
    // Verify Admin Bookings Filter
    // ----------------------------------------------------
    console.log("Verifying Admin Bookings Filter...");
    
    // Select Active filter
    await page.select('#adminBookingFilter', 'active');
    await delay(1000);
    let rowsActive = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      return rows.map(r => r.textContent);
    });
    const hasCompletedInActive = rowsActive.some(r => r.includes(studentName) && r.includes('已完成'));
    console.log(`Booking is visible in Active filter? ${hasCompletedInActive}`);
    if (hasCompletedInActive) {
      throw new Error("Completed booking should be hidden under Active filter");
    }

    // Select History filter
    await page.select('#adminBookingFilter', 'history');
    await delay(1000);
    let rowsHistory = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      return rows.map(r => r.textContent);
    });
    const hasCompletedInHistory = rowsHistory.some(r => r.includes(studentName) && r.includes('已完成'));
    console.log(`Booking is visible in History filter? ${hasCompletedInHistory}`);
    if (!hasCompletedInHistory) {
      throw new Error("Completed booking should be visible under History filter");
    }

    // Reset filter
    await page.select('#adminBookingFilter', 'all');
    await delay(1000);

    // Save screenshot of booking edit
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'test_admin_booking_edited.png') });

    // Delete Student match request created in Step 2
    console.log("Deleting matching request via Admin Portal...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('Requests 需求管理'));
      if (target) target.click();
    });
    await delay(2000);

    // Set dialog handler to accept delete prompt
    page.on('dialog', async dialog => {
      console.log(`[Dialog] Confirming deletion dialog: "${dialog.message()}"`);
      await dialog.accept();
    });

    // Find row with matchReqTitle and click 刪除
    const deleteBtn = await page.evaluateHandle((targetTitle) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      const targetRow = rows.find(r => r.textContent.includes(targetTitle));
      if (!targetRow) return null;
      const buttons = Array.from(targetRow.querySelectorAll('button'));
      return buttons.find(b => b.textContent.trim() === '刪除');
    }, matchReqTitle);

    if (!deleteBtn || !(await deleteBtn.asElement())) {
      throw new Error(`Could not find delete button for target request "${matchReqTitle}"`);
    }

    await deleteBtn.asElement().click();
    await delay(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_9_admin_crud_complete.png') });

    // Verify deletion
    const requestDeleted = await page.evaluate((targetTitle) => {
      const rows = Array.from(document.querySelectorAll('.admin-section table.admin-table tbody tr'));
      return !rows.some(r => r.textContent.includes(targetTitle));
    }, matchReqTitle);
    console.log(`Request deletion verified: ${requestDeleted}`);
    if (!requestDeleted) throw new Error("Match request deletion failed in Admin Portal");

    // Logout Admin
    const logoutAdminBtnFinal = await page.$('.btn-signout');
    await logoutAdminBtnFinal.click();
    await delay(2000);

    // Reload page to verify persistence and execution on reload
    console.log("Reloading page to verify tracking script persistence...");
    await page.reload();
    await delay(2500);
    const testTrackingLoadedAfterReload = await page.evaluate(() => window.testTrackingLoaded);
    console.log(`Verify tracking script executed after reload: ${testTrackingLoadedAfterReload}`);
    if (testTrackingLoadedAfterReload !== true) {
      throw new Error("Google Tracking Script did not persist or execute upon page reload");
    }

    // ==========================================
    // STEP 9: VERIFY HISTORY FLOW ON STUDENT AND TUTOR PORTALS
    // ==========================================
    console.log("\n[Step 9] Verifying history separation on Student and Tutor Portals...");

    // Login as Student
    const loginBtnStudent4 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnStudent4.click();
    await delay(1000);
    await fillInput(page, '.auth-form input[type="email"]', studentEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const submitLoginStudent3 = await page.$('.btn-auth-submit');
    await submitLoginStudent3.click();
    await delay(3500);

    // Verify system announcement banner is visible
    console.log("Verifying system announcement banner is visible...");
    const bannerText = await page.evaluate(() => {
      const banner = document.querySelector('.system-announcement-banner');
      return banner ? banner.textContent : null;
    });
    console.log(`Announcement banner text: "${bannerText}"`);
    if (!bannerText || !bannerText.includes('澳門學生網系統升級維護通知')) {
      throw new Error(`Expected system announcement banner to be visible and display "澳門學生網系統升級維護通知", but got "${bannerText}"`);
    }

    // Close announcement banner
    console.log("Closing announcement banner...");
    const closeBannerBtn = await page.$('.announcement-close-btn');
    if (!closeBannerBtn) throw new Error("Could not find announcement close button");
    await closeBannerBtn.click();
    await delay(1000);

    // Verify it is closed
    const bannerVisibleAfterClose = await page.evaluate(() => {
      const banner = document.querySelector('.system-announcement-banner');
      return !!banner;
    });
    console.log(`Banner visible after close? ${bannerVisibleAfterClose}`);
    if (bannerVisibleAfterClose) {
      throw new Error("Announcement banner should be hidden after clicking close button");
    }

    // Go to My Bookings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('我的預約狀態'));
      if (target) target.click();
    });
    await delay(2000);



    // Check student booking is under History section
    const studentHistoryChecked = await page.evaluate((tName) => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const activeHeader = headers.find(h => h.textContent.includes('進行中預約'));
      const historyHeader = headers.find(h => h.textContent.includes('歷史預約記錄'));
      if (!activeHeader || !historyHeader) return { error: "Missing headers" };

      const activeDiv = activeHeader.parentElement;
      const historyDiv = historyHeader.parentElement;

      const activeText = activeDiv ? activeDiv.textContent : "";
      const historyText = historyDiv ? historyDiv.textContent : "";

      return {
        inActive: activeText.includes(tName),
        inHistory: historyText.includes(tName)
      };
    }, tutorName);

    console.log("Student Dashboard verification result:", studentHistoryChecked);
    if (studentHistoryChecked.error) {
      throw new Error(`Student Dashboard error: ${studentHistoryChecked.error}`);
    }
    if (studentHistoryChecked.inActive) {
      throw new Error("Completed booking found in Student Active section");
    }
    if (!studentHistoryChecked.inHistory) {
      throw new Error("Completed booking NOT found in Student History section");
    }

    // Screenshot of Student History Bookings
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_6_student_my_bookings.png') });

    // Logout student
    const logoutBtnStudent4 = await page.$('.btn-signout');
    await logoutBtnStudent4.click();
    await delay(2000);

    // Login as Tutor
    const loginBtnTutor3 = await findButtonByText(page, "登入 / 註冊");
    await loginBtnTutor3.click();
    await delay(1000);
    await fillInput(page, '.auth-form input[type="email"]', tutorEmail);
    await fillInput(page, '.auth-form input[type="password"]', password);
    const submitLoginTutor2 = await page.$('.btn-auth-submit');
    await submitLoginTutor2.click();
    await delay(3500);

    // Go to Tutor Received Bookings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.dashboard-controls button'));
      const target = buttons.find(b => b.textContent.includes('收到的預約申請'));
      if (target) target.click();
    });
    await delay(2000);



    // Check tutor booking is under History section
    const tutorHistoryChecked = await page.evaluate((sName) => {
      const headers = Array.from(document.querySelectorAll('h3'));
      const activeHeader = headers.find(h => h.textContent.includes('待處理與進行中預約'));
      const historyHeader = headers.find(h => h.textContent.includes('歷史對接記錄'));
      if (!activeHeader || !historyHeader) return { error: "Missing headers" };

      const activeDiv = activeHeader.parentElement;
      const historyDiv = historyHeader.parentElement;

      const activeText = activeDiv ? activeDiv.textContent : "";
      const historyText = historyDiv ? historyDiv.textContent : "";

      return {
        inActive: activeText.includes(sName),
        inHistory: historyText.includes(sName)
      };
    }, studentName);

    console.log("Tutor Dashboard verification result:", tutorHistoryChecked);
    if (tutorHistoryChecked.error) {
      throw new Error(`Tutor Dashboard error: ${tutorHistoryChecked.error}`);
    }
    if (tutorHistoryChecked.inActive) {
      throw new Error("Completed booking found in Tutor Active section");
    }
    if (!tutorHistoryChecked.inHistory) {
      throw new Error("Completed booking NOT found in Tutor History section");
    }

    // Screenshot of Tutor History Bookings
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'feat_7_tutor_accepted_booking.png') });

    // Logout tutor
    const logoutBtnTutor3 = await page.$('.btn-signout');
    await logoutBtnTutor3.click();
    await delay(2000);

    console.log("\n✅ Comprehensive E2E Features Test (with Tutor Verification) completed successfully!");
  } catch (error) {
    console.error("\n❌ E2E Features Test Failed with Error:", error);
    if (page) {
      try {
        const url = page.url();
        console.log("Failure URL:", url);
        const screenshotPath = path.join(SCREENSHOT_DIR, 'feat_failure.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`Saved failure screenshot to ${screenshotPath}`);
        const content = await page.content();
        fs.writeFileSync(path.join(SCREENSHOT_DIR, 'feat_failure_html.txt'), content);
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
