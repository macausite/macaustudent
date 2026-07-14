import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// API Base URL retrieved from Vite environment variables (falling back to emulator default)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/demo-macaustudent/us-central1/api';

// Fallback Mock Datasets for seamless presentation if backend API is not yet running
const MOCK_TUTORS = [
  {
    id: "t1",
    name: "Dr. Sofia Sou (蘇博士)",
    subjects: ["Math", "Physics"],
    rate: 350,
    rating: 4.9,
    education: "澳門大學 (UM) 數學博士",
    location: "Taipa",
    bio: "資深大學講師，專長於中學微積分、矩陣及大學代數入學試輔導，教學方式耐心易懂。",
    availableSlots: ["星期六 10:00 - 12:00", "星期六 14:00 - 16:00", "星期日 10:00 - 12:00"],
    curriculums: ["國際學制 (IB / IGCSE / A-Levels)", "澳門/內地學制 (四校聯考 / DSE)"],
    reviews: [
      { student: "Pedro M.", rating: 5, text: "非常優秀的老師！把複雜的線性代數用圖形化步驟解釋得非常清楚。" }
    ],
    isApproved: true
  },
  {
    id: "t2",
    name: "Mr. Lucas Chao (周老師)",
    subjects: ["English", "Portuguese"],
    rate: 250,
    rating: 4.7,
    education: "澳門旅遊大學 (UTM) 英語研究學士",
    location: "Macau Peninsula",
    bio: "三語本地教師，提供實用英語/葡語口語對話、IELTS及劍橋英語備考，熟悉本地學校課程結構。",
    availableSlots: ["星期一 18:00 - 20:00", "星期三 18:00 - 20:00"],
    curriculums: ["葡萄牙學制 (Exame Nacional / Ensino Secundário)", "國際學制 (IB / IGCSE / A-Levels)"],
    reviews: [
      { student: "Vasco S.", rating: 4, text: "非常友好且有趣的葡語口語練習！" }
    ],
    isApproved: true
  },
  {
    id: "t3",
    name: "Ms. Chloe Wong (黃老師)",
    subjects: ["Chemistry", "Biology"],
    rate: 300,
    rating: 4.8,
    education: "澳門科技大學 (MUST) 生物化學碩士",
    location: "Taipa",
    bio: "互動式中學生化備考。專注於分子結構和細胞生物學，結合生動的動態多媒體進行示範教學。",
    availableSlots: ["星期六 09:00 - 11:00", "星期日 15:00 - 17:00"],
    curriculums: ["國際學制 (IB / IGCSE / A-Levels)"],
    reviews: [],
    isApproved: true
  }
];

const MOCK_BOOKINGS = [
  {
    id: "b1",
    tutorId: "t1",
    tutorName: "Dr. Sofia Sou (蘇博士)",
    studentName: "學生成員",
    dateTime: "星期六 14:00 - 16:00",
    subject: "Math",
    status: "confirmed"
  },
  {
    id: "b2",
    tutorId: "t3",
    tutorName: "Ms. Chloe Wong (黃老師)",
    studentName: "學生成員",
    dateTime: "星期日 15:00 - 17:00",
    subject: "Chemistry",
    status: "pending"
  }
];

const MOCK_REQUESTS = [
  {
    id: "r1",
    title: "尋求 IELTS 英語口語備考",
    subject: "English",
    budget: 220,
    date: "2026-06-04",
    description: "尋找一位英語導師進行每週一次的口語模擬測試。平日晚間時間彈性， Peninsula 面授或網課。"
  },
  {
    id: "r2",
    title: "澳大四校聯考數學科溫習",
    subject: "Math",
    budget: 320,
    date: "2026-06-03",
    description: "四校聯考前需要緊急重溫三角學和幾何矩陣。氹仔區面授優先，星期六日上課。"
  }
];

const CURRICULUM_OPTIONS = [
  "葡萄牙學制 (Exame Nacional / Ensino Secundário)",
  "國際學制 (IB / IGCSE / A-Levels)",
  "澳門/內地學制 (四校聯考 / DSE)"
];

const AVAILABLE_SUBJECTS = ["Math", "Physics", "Chemistry", "Biology", "English", "Portuguese", "Coding"];

// Traditional Chinese Texts Constants (PORTUGUESE & ENGLISH REMOVED)
const t = {
  brandName: "澳門學生網",
  studentPortal: "🎓 學生控制台",
  tutorPortal: "💼 教師門戶",
  apiConnected: "API 已連線",
  apiOffline: "模擬模式 (API 離線)",
  checkingConnection: "正在檢查 API...",
  retry: "重試",
  heroBadge: "澳門歷史特色 • 專業學科家教配對平台",
  heroSubtitle: "直接聯繫經審核的本地教師與優秀大學生。篩選特定學校課程體系（葡萄牙學制、國際課程、四校聯考），輕鬆查看導師技能並線上預約。",
  allStudentHub: "所有功能",
  browseTutors: "瀏覽導師目錄",
  myBookings: "我的預約狀態",
  requestsBoard: "學生需求配對板",
  tutorTitle: "verified 專業導師庫",
  tutorSubtitle: "服務於澳門半島、氹仔及路環的學科導師檔案（公開瀏覽）",
  filterSubject: "科目",
  filterLocation: "地區",
  filterCurriculum: "學制體系",
  allSubjects: "所有科目",
  allLocations: "所有地區",
  allCurriculums: "所有學制體系",
  rateSuffix: " MOP / 小時",
  chooseSubject: "選擇科目",
  chooseTime: "選擇時段",
  bookBtn: "預約此時段",
  noTutors: "沒有找到符合篩選條件的導師。",
  bookingsTitle: "我的預約控制台",
  bookingsSubtitle: "在此追蹤您向導師提交的預約申請狀態",
  noBookings: "目前沒有預約記錄。請在上方瀏覽導師並發起預約！",
  cancelRequest: "取消預約",
  sessionWith: "與 {name} 的教學預約",
  scheduledTime: "預約時段:",
  postRequestTitle: "發佈家教需求板",
  postRequestSubtitle: "發佈您的學習要求，讓符合條件的導師主動與您聯繫",
  newRequestForm: "填寫家教需求",
  formReqTitle: "家教需求標題",
  formReqBudget: "目標預算 (MOP/小時)",
  formReqDesc: "詳細描述 (年級、課程體系、時間要求等)",
  formSubmit: "發佈配對需求",
  noRequests: "目前沒有學生發佈需求。在左側表單中發佈您的需求吧！",
  postDate: "發佈日期:",
  deleteBtn: "刪除",
  tutorFormTitle: "導師入駐表單",
  tutorFormSubtitle: "在澳門導師庫中註冊或修改您的教學檔案",
  tutorName: "真實姓名 / 稱呼",
  tutorRate: "課酬時薪 (MOP/小時)",
  tutorLoc: "首選授課地區",
  tutorEdu: "教育背景 / 學歷",
  tutorSubjects: "教授科目 (可多選)",
  tutorCurriculums: "熟習學制 (可多選)",
  tutorSlots: "新增可授課時間段",
  tutorBio: "個人簡介與教學理念",
  btnPublish: "發佈導師檔案",
  btnEdit: "修改檔案資料",
  btnCancelEdit: "取消修改",
  bookingReceivedTitle: "收到的預約申請",
  bookingReceivedSubtitle: "澳門學生向您申請的可授課預約時段",
  noRegisteredProfile: "請在左側填寫並發佈您的導師檔案，以便查看收到的預約申請。",
  noReceivedBookings: "目前沒有收到預約申請。當學生發起預約時，將會顯示在此處！",
  approveBooking: "確認預約",
  rejectBooking: "拒絕預約",
  completeBooking: "標記為已完成",
  cancelBooking: "取消課程",
  lessonArchived: "✓ 課程已完成並歸檔",
  lessonCancelled: "✕ 課程已取消",
  toastSuccess: "已成功連接澳門導師數據庫！",
  toastOffline: "API 連線失敗，已啟動本地模擬數據。",
  toastBooked: "已成功向該導師發送預約申請！",
  toastNoteAdded: "已發佈您的家教配對需求！",
  toastTutorRegistered: "您的導師檔案已成功註冊並發佈！",
  copyright: "© 2026 澳門師生港. 結合葡式美學與 Firebase Auth 安全配對。",
  
  // Auth labels
  authTitleSignIn: "會員登入",
  authTitleSignUp: "註冊會員",
  authDescSignIn: "進入澳門師生配對平台以管理預約及個人資訊",
  authDescSignUp: "填寫資訊以註冊成為學生或導師",
  labelEmail: "電子郵件地址",
  labelPassword: "密碼",
  labelName: "您的名字 / 稱呼",
  btnSignIn: "立即登入",
  btnSignUp: "立即註冊",
  btnGuest: "以訪客身份快速體驗 (Demo)",
  toggleToSignUp: "還沒有帳戶？立即註冊",
  toggleToSignIn: "已有帳戶？點此登入",
  logout: "登出",
  toastWelcome: "歡迎回來，{name}！"
};

function App() {
  // Shared Portal States
  const [tutors, setTutors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  // User Auth State (Now completely public landing, auth checked on actions)
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Login Modal control state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('student'); // 'student' or 'tutor'
  const [authError, setAuthError] = useState('');
  
  // Stored pending action to execute after user logs in successfully
  const [pendingAction, setPendingAction] = useState(null);

  // Dynamic user portal view: 'student' or 'tutor'
  const [userRole, setUserRole] = useState('student');

  // Input states for booking session choices (Student side)
  const [selectedSlots, setSelectedSlots] = useState({});
  const [bookingSubject, setBookingSubject] = useState({});

  // Match Request Board states (Student side)
  const [reqTitle, setReqTitle] = useState('');
  const [reqSubject, setReqSubject] = useState('Math');
  const [reqBudget, setReqBudget] = useState('');
  const [reqDescription, setReqDescription] = useState('');

  // Tutor Onboarding states (Tutor side)
  const [tutorNameForm, setTutorNameForm] = useState('');
  const [tutorEduForm, setTutorEduForm] = useState('');
  const [tutorRateForm, setTutorRateForm] = useState('');
  const [tutorLocForm, setTutorLocForm] = useState('Taipa');
  const [tutorBioForm, setTutorBioForm] = useState('');
  const [tutorSubjectsForm, setTutorSubjectsForm] = useState([]);
  const [tutorCurriculumsForm, setTutorCurriculumsForm] = useState([]);
  const [slotInputForm, setSlotInputForm] = useState('');
  const [addedSlotsForm, setAddedSlotsForm] = useState(['Sat 10:00 - 12:00', 'Sun 14:00 - 16:00']);
  
  // Tracking if a tutor profile was registered in current session
  const [myRegisteredTutor, setMyRegisteredTutor] = useState(null);
  const [isEditingTutor, setIsEditingTutor] = useState(true);

  // Filters for Tutors Explorer
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // Student tabs: 'all', 'tutors', 'bookings', 'requests'
  const [adminBookingFilter, setAdminBookingFilter] = useState('all'); // 'all', 'active', 'history'
  
  // Global Platform Settings (Admin)
  const [globalAnnouncement, setGlobalAnnouncement] = useState(() => localStorage.getItem('globalAnnouncement') || '');
  const [globalCommission, setGlobalCommission] = useState(() => Number(localStorage.getItem('globalCommission')) || 2);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [googleTrackingScript, setGoogleTrackingScript] = useState(() => localStorage.getItem('googleTrackingScript') || '');
  const [smsVerificationEnabled, setSmsVerificationEnabled] = useState(() => localStorage.getItem('smsVerificationEnabled') === 'true');

  // Auth Form SMS verification states
  const [authPhone, setAuthPhone] = useState('');
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerificationMessage, setOtpVerificationMessage] = useState('');

  // Admin Editing Modal states
  const [adminEditModalOpen, setAdminEditModalOpen] = useState(false);
  const [adminEditType, setAdminEditType] = useState('tutor'); // 'tutor', 'booking', 'request'
  const [adminEditId, setAdminEditId] = useState('');

  // Admin edit form states
  const [adminEditTutorName, setAdminEditTutorName] = useState('');
  const [adminEditTutorEdu, setAdminEditTutorEdu] = useState('');
  const [adminEditTutorRate, setAdminEditTutorRate] = useState('');
  const [adminEditTutorLoc, setAdminEditTutorLoc] = useState('Taipa');
  const [adminEditTutorBio, setAdminEditTutorBio] = useState('');
  const [adminEditTutorSubjects, setAdminEditTutorSubjects] = useState([]);
  const [adminEditTutorCurriculums, setAdminEditTutorCurriculums] = useState([]);
  const [adminEditTutorSlots, setAdminEditTutorSlots] = useState([]);
  const [adminEditTutorSlotInput, setAdminEditTutorSlotInput] = useState('');
  const [adminEditTutorApproved, setAdminEditTutorApproved] = useState(false);

  const [adminEditBookingStudent, setAdminEditBookingStudent] = useState('');
  const [adminEditBookingSubject, setAdminEditBookingSubject] = useState('');
  const [adminEditBookingDateTime, setAdminEditBookingDateTime] = useState('');
  const [adminEditBookingStatus, setAdminEditBookingStatus] = useState('pending');

  const [adminEditRequestTitle, setAdminEditRequestTitle] = useState('');
  const [adminEditRequestSubject, setAdminEditRequestSubject] = useState('');
  const [adminEditRequestBudget, setAdminEditRequestBudget] = useState('');
  const [adminEditRequestDesc, setAdminEditRequestDesc] = useState('');

  // Connection settings
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [isApiSimulated, setIsApiSimulated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const injectGoogleTrackingScript = (scriptStr) => {
    // Clean up old scripts
    const oldScripts = document.querySelectorAll('.google-tracking-tag');
    oldScripts.forEach(el => el.remove());

    if (!scriptStr) return;

    try {
      const container = document.createElement('div');
      container.innerHTML = scriptStr;

      const scripts = container.querySelectorAll('script');
      scripts.forEach(s => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(s.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Copy inline content
        newScript.textContent = s.textContent;
        newScript.classList.add('google-tracking-tag');

        document.head.appendChild(newScript);
      });
    } catch (e) {
      console.error("Failed to inject Google tracking script:", e);
    }
  };

  // Reset OTP states when modal opens/closes or toggles signin/signup
  useEffect(() => {
    setAuthPhone('');
    setAuthOtpCode('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpError('');
    setOtpVerificationMessage('');
  }, [loginModalOpen, authMode]);

  // Run Google Tracking Script on load
  useEffect(() => {
    const savedScript = localStorage.getItem('googleTrackingScript') || '';
    if (savedScript) {
      injectGoogleTrackingScript(savedScript);
    }
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // Close modal if open on login success
        setLoginModalOpen(false);
        
        let parsedName = user.email ? user.email.split('@')[0] : "訪客";
        let parsedRole = 'student';
        
        if (user.displayName) {
          try {
            const data = JSON.parse(user.displayName);
            parsedName = data.name;
            parsedRole = data.role;
          } catch (e) {
            parsedName = user.displayName;
            if (user.displayName.includes('導師') || user.displayName.includes('Tutor') || user.displayName.includes('💼')) {
              parsedRole = 'tutor';
            }
          }
        }
        
        setTutorNameForm(parsedName);
        setUserRole(parsedRole);
        
        if (parsedRole === 'tutor') {
          setActiveTab('tutor-profile');
        } else if (parsedRole === 'admin') {
          setActiveTab('admin-overview');
        } else {
          setActiveTab('all');
        }
        
        const welcomeMsg = t.toastWelcome.replace('{name}', parsedName);
        triggerToast(welcomeMsg);
      } else {
        setUserRole('student');
        setActiveTab('all');
      }
    });
    return () => unsubscribe();
  }, []);

  // Connect and fetch data from API (Public directory query runs immediately)
  const loadData = async () => {
    try {
      setConnectionStatus('checking');
      const healthRes = await fetch(`${API_URL}/health`).catch(() => null);

      if (healthRes && healthRes.ok) {
        setConnectionStatus('online');
        setIsApiSimulated(false);

        const [tutorsRes, bookingsRes, requestsRes] = await Promise.all([
          fetch(`${API_URL}/tutors?_t=${Date.now()}`).then(r => r.json()),
          fetch(`${API_URL}/bookings?_t=${Date.now()}`).then(r => r.json()),
          fetch(`${API_URL}/requests?_t=${Date.now()}`).then(r => r.json())
        ]);


        setTutors(tutorsRes);
        setBookings(bookingsRes);
        setRequests(requestsRes);
        
        // Initialize booking choice inputs
        const initialSlots = {};
        const initialSubjects = {};
        tutorsRes.forEach(t => {
          initialSlots[t.id] = t.availableSlots[0] || '';
          initialSubjects[t.id] = t.subjects[0] || '';
        });
        setSelectedSlots(initialSlots);
        setBookingSubject(initialSubjects);

        triggerToast(t.toastSuccess);
      } else {
        throw new Error("API unreachable");
      }
    } catch (err) {
      console.warn("Backend REST API offline. Using simulated data mode.", err);
      setConnectionStatus('offline');
      setIsApiSimulated(true);

      setTutors(MOCK_TUTORS);
      setBookings(MOCK_BOOKINGS);
      setRequests(MOCK_REQUESTS);

      const initialSlots = {};
      const initialSubjects = {};
      MOCK_TUTORS.forEach(t => {
        initialSlots[t.id] = t.availableSlots[0] || '';
        initialSubjects[t.id] = t.subjects[0] || '';
      });
      setSelectedSlots(initialSlots);
      setBookingSubject(initialSubjects);

      triggerToast(t.toastOffline);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Execute any pending actions that triggered the login modal after user authenticates
  useEffect(() => {
    if (currentUser && pendingAction) {
      if (pendingAction.type === 'book') {
        handleCreateBooking(pendingAction.data);
      } else if (pendingAction.type === 'tutor') {
        setUserRole('tutor');
      } else if (pendingAction.type === 'mybookings') {
        setActiveTab('bookings');
      }
      setPendingAction(null);
    }
  }, [currentUser, pendingAction]);

  // Synchronize tutor profile state when a registered tutor logs in
  useEffect(() => {
    if (currentUser && userRole === 'tutor' && tutors.length > 0 && tutorNameForm) {
      const match = tutors.find(t => t.name.toLowerCase() === tutorNameForm.toLowerCase());
      if (match) {
        setMyRegisteredTutor(match);
        setIsEditingTutor(false);
      }
    }
  }, [currentUser, userRole, tutors, tutorNameForm]);

  // Auth Submit Action
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) return;

    if (authMode === 'signup' && smsVerificationEnabled) {
      if (!otpVerified) {
        setAuthError("請先完成簡訊驗證碼驗證");
        return;
      }
    }

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const displayNameString = JSON.stringify({
          name: authName || authEmail.split('@')[0],
          role: authRole
        });
        await updateProfile(userCredential.user, {
          displayName: displayNameString
        });
        
        // Manually sync states because onAuthStateChanged does not fire after updateProfile
        setCurrentUser({ ...auth.currentUser });
        setUserRole(authRole);
        setTutorNameForm(authName || authEmail.split('@')[0]);
        if (authRole === 'tutor') {
          setActiveTab('tutor-profile');
        } else if (authRole === 'admin') {
          setActiveTab('admin-overview');
        } else {
          setActiveTab('all');
        }
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err) {
      console.error("Auth error: ", err);
      setAuthError(err.message.replace("Firebase:", ""));
    }
  };

  // Auth Guest Demo Login Action
  const handleGuestLogin = async (role) => {
    setAuthError('');
    try {
      const userCredential = await signInAnonymously(auth);
      const guestName = role === 'admin' ? "訪客管理員 👑" : role === 'tutor' ? "訪客導師 🇲🇴" : "訪客學生 🇲🇴";
      const displayNameString = JSON.stringify({
        name: guestName,
        role: role
      });
      await updateProfile(userCredential.user, {
        displayName: displayNameString
      });
      
      // Manually sync states for guest login
      setCurrentUser({ ...auth.currentUser });
      setUserRole(role);
      setTutorNameForm(guestName);
      if (role === 'tutor') {
        setActiveTab('tutor-profile');
      } else if (role === 'admin') {
        setActiveTab('admin-overview');
      } else {
        setActiveTab('all');
      }
    } catch (err) {
      setAuthError("Failed to initiate guest account: " + err.message);
    }
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpVerificationMessage('');
    if (!authPhone || authPhone.length !== 8) {
      setOtpError("請輸入正確的 8 位數澳門手機號碼");
      return;
    }
    
    setIsSendingOtp(true);
    try {
      const fullPhone = "+853" + authPhone;
      const res = await fetch(`${API_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpVerificationMessage("已發送驗證碼，請檢查您的手機簡訊。");
        // Log dev code to console for automation tests
        if (data.devCode) {
          console.log("DEV Verification Code:", data.devCode);
          window.devOtpCode = data.devCode;
        }
      } else {
        setOtpError(data.error || "發送失敗，請重試");
      }
    } catch (err) {
      console.error(err);
      setOtpError("網絡錯誤，無法發送簡訊");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpVerificationMessage('');
    if (!authOtpCode || authOtpCode.length !== 6) {
      setOtpError("請輸入 6 位數簡訊驗證碼");
      return;
    }

    try {
      const fullPhone = "+853" + authPhone;
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone, otpCode: authOtpCode })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        setOtpVerificationMessage("✓ 手機號碼驗證成功！");
      } else {
        setOtpError(data.error || "驗證碼錯誤，請重新輸入");
      }
    } catch (err) {
      console.error(err);
      setOtpError("網絡錯誤，無法進行驗證");
    }
  };

  // Sign Out Action
  const handleSignOut = () => {
    signOut(auth).then(() => {
      setMyRegisteredTutor(null);
      setIsEditingTutor(true);
      setActiveTab('all');
      setUserRole('student');
      triggerToast("已成功登出帳戶！");
    });
  };

  // Switch student tab views (My Sessions requires login modal)
  const handleStudentTabSwitch = (tab) => {
    if (tab === 'bookings' && !currentUser) {
      setPendingAction({ type: 'mybookings' });
      setAuthMode('signin');
      setLoginModalOpen(true);
      triggerToast("查看個人預約前請先登入會員。");
      return;
    }
    setActiveTab(tab);
  };

  // Action: Create Booking (Student) - requires auth
  const handleCreateBooking = async (tutor) => {
    if (!currentUser) {
      setPendingAction({ type: 'book', data: tutor });
      setAuthMode('signin');
      setLoginModalOpen(true);
      triggerToast("預約導師前請先登入會員。");
      return;
    }

    const slot = selectedSlots[tutor.id];
    const subject = bookingSubject[tutor.id];
    if (!slot || !subject) {
      triggerToast("請選擇學科和時段！");
      return;
    }

    let studentIdentifier = "學生會員";
    if (currentUser) {
      if (currentUser.displayName) {
        try {
          const data = JSON.parse(currentUser.displayName);
          studentIdentifier = data.name;
        } catch (e) {
          studentIdentifier = currentUser.displayName;
        }
      } else if (currentUser.email) {
        studentIdentifier = currentUser.email.split('@')[0];
      }
    }

    if (isApiSimulated) {
      const localNewBooking = {
        id: Date.now().toString(),
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentName: studentIdentifier,
        dateTime: slot,
        subject: subject,
        status: "pending"
      };
      setBookings([localNewBooking, ...bookings]);
      triggerToast(t.toastBooked);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          tutorName: tutor.name,
          dateTime: slot,
          subject: subject,
          studentName: studentIdentifier
        })
      });

      if (res.ok) {
        const addedBooking = await res.json();
        setBookings([addedBooking, ...bookings]);
        triggerToast(t.toastBooked);
      } else {
        throw new Error("Booking failed");
      }
    } catch (err) {
      triggerToast("Error: Booking could not connect to API");
    }
  };

  // Action: Modify Booking Status (Tutor)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    if (isApiSimulated) {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      triggerToast(`預約狀態已更新為 ${newStatus}`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
        triggerToast(`預約狀態已更新為 ${newStatus}`);
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      triggerToast("Error: Booking status could not update on backend");
    }
  };

  // Action: Add Match Request (Student) - requires auth
  const handleAddRequest = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthMode('signin');
      setLoginModalOpen(true);
      triggerToast("發佈需求前請先登入會員。");
      return;
    }

    if (!reqTitle.trim() || !reqDescription.trim() || !reqBudget) return;

    if (isApiSimulated) {
      const localNewRequest = {
        id: Date.now().toString(),
        title: reqTitle,
        subject: reqSubject,
        budget: Number(reqBudget),
        date: new Date().toISOString().split('T')[0],
        description: reqDescription
      };
      setRequests([localNewRequest, ...requests]);
      setReqTitle('');
      setReqBudget('');
      setReqDescription('');
      triggerToast(t.toastNoteAdded);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reqTitle,
          subject: reqSubject,
          budget: Number(reqBudget),
          description: reqDescription
        })
      });

      if (res.ok) {
        const addedRequest = await res.json();
        setRequests([addedRequest, ...requests]);
        setReqTitle('');
        setReqBudget('');
        setReqDescription('');
        triggerToast(t.toastNoteAdded);
      } else {
        throw new Error("Post failed");
      }
    } catch (err) {
      triggerToast("Error: Could not connect to API");
    }
  };

  // Action: Delete Match Request (Student)
  const handleDeleteRequest = async (id) => {
    if (isApiSimulated) {
      setRequests(requests.filter(r => r.id !== id));
      triggerToast("需求已刪除！");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/requests/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setRequests(requests.filter(r => r.id !== id));
        triggerToast("需求已刪除！");
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      triggerToast("Error: Request could not be removed on backend");
    }
  };

  // Action: Register Tutor Profile (Tutor)
  const handleRegisterTutor = async (e) => {
    e.preventDefault();
    if (!tutorNameForm.trim() || !tutorEduForm.trim() || !tutorRateForm || tutorSubjectsForm.length === 0 || addedSlotsForm.length === 0 || tutorCurriculumsForm.length === 0) {
      triggerToast("請完整填寫導師基本資料、可教授科目、熟習學制以及時間段！");
      return;
    }

    const payload = {
      name: tutorNameForm,
      subjects: tutorSubjectsForm,
      rate: Number(tutorRateForm),
      education: tutorEduForm,
      location: tutorLocForm,
      bio: tutorBioForm || "服務於澳門的專業學術導師。",
      availableSlots: addedSlotsForm,
      curriculums: tutorCurriculumsForm
    };

    if (isApiSimulated) {
      const localNewTutor = {
        id: "t" + Date.now().toString(),
        ...payload,
        rating: 5.0,
        reviews: []
      };
      setTutors([localNewTutor, ...tutors]);
      setMyRegisteredTutor(localNewTutor);
      
      setSelectedSlots({ ...selectedSlots, [localNewTutor.id]: localNewTutor.availableSlots[0] });
      setBookingSubject({ ...bookingSubject, [localNewTutor.id]: localNewTutor.subjects[0] });

      setIsEditingTutor(false);
      triggerToast(t.toastTutorRegistered);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tutors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const addedTutor = await res.json();
        setTutors([addedTutor, ...tutors]);
        setMyRegisteredTutor(addedTutor);

        setSelectedSlots({ ...selectedSlots, [addedTutor.id]: addedTutor.availableSlots[0] });
        setBookingSubject({ ...bookingSubject, [addedTutor.id]: addedTutor.subjects[0] });

        setIsEditingTutor(false);
        triggerToast(t.toastTutorRegistered);
      } else {
        throw new Error("Tutor registration failed");
      }
    } catch (err) {
      triggerToast("Error: Could not publish profile to API");
    }
  };

  // Helper onboarding actions
  const handleAddSlot = () => {
    if (!slotInputForm.trim()) return;
    if (addedSlotsForm.includes(slotInputForm.trim())) return;
    setAddedSlotsForm([...addedSlotsForm, slotInputForm.trim()]);
    setSlotInputForm('');
  };

  const handleRemoveSlot = (slot) => {
    setAddedSlotsForm(addedSlotsForm.filter(s => s !== slot));
  };

  const handleSubjectCheckbox = (subject) => {
    if (tutorSubjectsForm.includes(subject)) {
      setTutorSubjectsForm(tutorSubjectsForm.filter(s => s !== subject));
    } else {
      setTutorSubjectsForm([...tutorSubjectsForm, subject]);
    }
  };

  const handleCurriculumCheckbox = (curr) => {
    if (tutorCurriculumsForm.includes(curr)) {
      setTutorCurriculumsForm(tutorCurriculumsForm.filter(c => c !== curr));
    } else {
      setTutorCurriculumsForm([...tutorCurriculumsForm, curr]);
    }
  };

  const handleAdminApproveTutor = async (id) => {
    if (isApiSimulated) {
      setTutors(tutors.map(t => t.id === id ? { ...t, isApproved: true } : t));
      triggerToast("已批准導師入駐（模擬模式）");
    } else {
      try {
        const res = await fetch(`${API_URL}/tutors/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true })
        });
        if (res.ok) {
          const updated = await res.json();
          setTutors(tutors.map(t => t.id === id ? updated : t));
          triggerToast("導師資質已成功認證並批准入駐！");
        } else {
          throw new Error("Approval failed");
        }
      } catch (err) {
        console.error("Approve tutor error: ", err);
        triggerToast("錯誤：無法完成審核");
      }
    }
  };

  // Admin handlers
  const handleEditClick = (type, record) => {
    setAdminEditType(type);
    setAdminEditId(record.id);
    if (type === 'tutor') {
      setAdminEditTutorName(record.name);
      setAdminEditTutorEdu(record.education);
      setAdminEditTutorRate(record.rate);
      setAdminEditTutorLoc(record.location);
      setAdminEditTutorBio(record.bio);
      setAdminEditTutorSubjects(record.subjects || []);
      setAdminEditTutorCurriculums(record.curriculums || []);
      setAdminEditTutorSlots(record.availableSlots || []);
      setAdminEditTutorSlotInput('');
      setAdminEditTutorApproved(record.isApproved === true);
    } else if (type === 'booking') {
      setAdminEditBookingStudent(record.studentName);
      setAdminEditBookingSubject(record.subject);
      setAdminEditBookingDateTime(record.dateTime);
      setAdminEditBookingStatus(record.status);
    } else if (type === 'request') {
      setAdminEditRequestTitle(record.title);
      setAdminEditRequestSubject(record.subject);
      setAdminEditRequestBudget(record.budget);
      setAdminEditRequestDesc(record.description);
    }
    setAdminEditModalOpen(true);
  };

  const handleDeleteClick = async (type, id) => {
    if (!window.confirm("確定要刪除此項目嗎？")) return;
    
    if (isApiSimulated) {
      if (type === 'tutor') {
        setTutors(tutors.filter(t => t.id !== id));
      } else if (type === 'booking') {
        setBookings(bookings.filter(b => b.id !== id));
      } else if (type === 'request') {
        setRequests(requests.filter(r => r.id !== id));
      }
      triggerToast("已成功刪除項目（模擬模式）");
    } else {
      try {
        const endpoint = type === 'tutor' ? 'tutors' : type === 'booking' ? 'bookings' : 'requests';
        const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          if (type === 'tutor') {
            setTutors(tutors.filter(t => t.id !== id));
          } else if (type === 'booking') {
            setBookings(bookings.filter(b => b.id !== id));
          } else if (type === 'request') {
            setRequests(requests.filter(r => r.id !== id));
          }
          triggerToast("已成功刪除項目！");
        } else {
          throw new Error("Deletion failed");
        }
      } catch (err) {
        console.error("Delete error: ", err);
        triggerToast("錯誤：無法刪除該項目");
      }
    }
  };

  const handleAdminEditSubmit = async (e) => {
    e.preventDefault();
    const id = adminEditId;
    const type = adminEditType;

    let payload = {};
    if (type === 'tutor') {
      payload = {
        name: adminEditTutorName,
        education: adminEditTutorEdu,
        rate: Number(adminEditTutorRate),
        location: adminEditTutorLoc,
        bio: adminEditTutorBio,
        subjects: adminEditTutorSubjects,
        curriculums: adminEditTutorCurriculums,
        availableSlots: adminEditTutorSlots,
        isApproved: adminEditTutorApproved
      };
    } else if (type === 'booking') {
      payload = {
        studentName: adminEditBookingStudent,
        subject: adminEditBookingSubject,
        dateTime: adminEditBookingDateTime,
        status: adminEditBookingStatus
      };
    } else if (type === 'request') {
      payload = {
        title: adminEditRequestTitle,
        subject: adminEditRequestSubject,
        budget: Number(adminEditRequestBudget),
        description: adminEditRequestDesc
      };
    }

    if (isApiSimulated) {
      if (type === 'tutor') {
        setTutors(tutors.map(t => t.id === id ? { ...t, ...payload } : t));
      } else if (type === 'booking') {
        setBookings(bookings.map(b => b.id === id ? { ...b, ...payload } : b));
      } else if (type === 'request') {
        setRequests(requests.map(r => r.id === id ? { ...r, ...payload } : r));
      }
      setAdminEditModalOpen(false);
      triggerToast("已成功修改項目（模擬模式）");
    } else {
      try {
        const endpoint = type === 'tutor' ? 'tutors' : type === 'booking' ? 'bookings' : 'requests';
        const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updatedRecord = await res.json();
          if (type === 'tutor') {
            setTutors(tutors.map(t => t.id === id ? updatedRecord : t));
          } else if (type === 'booking') {
            setBookings(bookings.map(b => b.id === id ? updatedRecord : b));
          } else if (type === 'request') {
            setRequests(requests.map(r => r.id === id ? updatedRecord : r));
          }
          setAdminEditModalOpen(false);
          triggerToast("已成功修改項目資訊！");
        } else {
          throw new Error("Update failed");
        }
      } catch (err) {
        console.error("Update error: ", err);
        triggerToast("錯誤：無法修改該項目資訊");
      }
    }
  };

  const handleSaveGlobalSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('globalAnnouncement', globalAnnouncement);
    localStorage.setItem('globalCommission', globalCommission.toString());
    localStorage.setItem('googleTrackingScript', googleTrackingScript);
    localStorage.setItem('smsVerificationEnabled', smsVerificationEnabled.toString());
    injectGoogleTrackingScript(googleTrackingScript);
    setShowAnnouncement(true);
    triggerToast("已成功更新並儲存平台全局設定及追蹤腳本！");
  };

  const handleAdminEditSubjectCheckbox = (subject) => {
    if (adminEditTutorSubjects.includes(subject)) {
      setAdminEditTutorSubjects(adminEditTutorSubjects.filter(s => s !== subject));
    } else {
      setAdminEditTutorSubjects([...adminEditTutorSubjects, subject]);
    }
  };

  const handleAdminEditCurriculumCheckbox = (curr) => {
    if (adminEditTutorCurriculums.includes(curr)) {
      setAdminEditTutorCurriculums(adminEditTutorCurriculums.filter(c => c !== curr));
    } else {
      setAdminEditTutorCurriculums([...adminEditTutorCurriculums, curr]);
    }
  };

  const handleAdminEditAddSlot = () => {
    if (!adminEditTutorSlotInput.trim()) return;
    if (adminEditTutorSlots.includes(adminEditTutorSlotInput.trim())) return;
    setAdminEditTutorSlots([...adminEditTutorSlots, adminEditTutorSlotInput.trim()]);
    setAdminEditTutorSlotInput('');
  };

  const handleAdminEditRemoveSlot = (slot) => {
    setAdminEditTutorSlots(adminEditTutorSlots.filter(s => s !== slot));
  };

  // Tutors List Filters
  const filteredTutors = tutors.filter(tutor => {
    const matchesSubject = filterSubject === 'all' || tutor.subjects.includes(filterSubject);
    const matchesLocation = filterLocation === 'all' || tutor.location === filterLocation;
    
    let matchesCurriculum = true;
    if (filterCurriculum !== 'all') {
      matchesCurriculum = tutor.curriculums && tutor.curriculums.some(c => c.includes(filterCurriculum.split(' (')[0]));
    }
    
    return matchesSubject && matchesLocation && matchesCurriculum && tutor.isApproved === true;
  });

  // Received bookings
  const tutorReceivedBookings = bookings.filter(b => 
    myRegisteredTutor && (b.tutorId === myRegisteredTutor.id || b.tutorName.toLowerCase() === myRegisteredTutor.name.toLowerCase())
  );

  // Student Bookings filtering
  const getStudentIdentifier = () => {
    if (!currentUser) return '';
    if (currentUser.displayName) {
      try {
        const data = JSON.parse(currentUser.displayName);
        return data.name;
      } catch (e) {
        return currentUser.displayName;
      }
    }
    return currentUser.email ? currentUser.email.split('@')[0] : '訪客';
  };

  const studentBookings = currentUser && userRole === 'student'
    ? bookings.filter(b => b.studentName === getStudentIdentifier())
    : [];


  const activeStudentBookings = studentBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const historyStudentBookings = studentBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const activeTutorBookings = tutorReceivedBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const historyTutorBookings = tutorReceivedBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const filteredAdminBookings = bookings.filter(b => {
    if (adminBookingFilter === 'active') {
      return b.status === 'pending' || b.status === 'confirmed';
    }
    if (adminBookingFilter === 'history') {
      return b.status === 'completed' || b.status === 'cancelled';
    }
    return true;
  });

  // Admin portal stats variables
  const pendingTutorsCount = tutors.filter(t => !t.isApproved).length;
  const approvedTutorsCount = tutors.filter(t => t.isApproved).length;
  const totalTutorsCount = tutors.length;

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookingsCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookingsCount = bookings.filter(b => b.status === 'cancelled').length;
  const totalBookingsCount = bookings.length;

  const totalRequestsCount = requests.length;

  const totalVolume = bookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    const tutor = tutors.find(t => t.id === b.tutorId || t.name.toLowerCase() === b.tutorName.toLowerCase());
    const rate = tutor ? tutor.rate : 300;
    return sum + (rate * 2); // baseline lesson of 2 hours
  }, 0);

  const getBookingDuration = (dateTimeStr) => {
    try {
      const times = dateTimeStr.match(/(\d{1,2}):(\d{2})/g);
      if (times && times.length >= 2) {
        const [startH, startM] = times[0].split(':').map(Number);
        const [endH, endM] = times[1].split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        const durationHours = (endMin - startMin) / 60;
        if (durationHours > 0 && durationHours < 24) {
          return durationHours;
        }
      }
    } catch (e) {}
    return 2; // fallback to 2 hours
  };

  const totalCommission = bookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    const tutor = tutors.find(t => t.id === b.tutorId || t.name.toLowerCase() === b.tutorName.toLowerCase());
    const rate = tutor ? tutor.rate : 300;
    const duration = getBookingDuration(b.dateTime);
    return sum + (rate * duration * globalCommission);
  }, 0);

  const renderBookingCard = (booking, isHistoryView) => {
    const cardStyle = isHistoryView 
      ? { opacity: 0.85, borderStyle: 'dashed', borderWidth: '1.5px', borderColor: 'rgba(0,0,0,0.15)' }
      : {};
    return (
      <div key={booking.id} className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <span className="badge badge-location" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>📚 {booking.subject}</span>
            <h3 style={{ fontSize: '1.25rem' }}>{t.sessionWith.replace('{name}', booking.tutorName)}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>學生: {booking.studentName}</p>
          </div>
          <span className={`badge badge-status ${booking.status}`}>
            {booking.status === 'pending' ? '審核中' : booking.status === 'confirmed' ? '已確認' : booking.status === 'completed' ? '已完成' : '已取消'}
          </span>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)', paddingLeft: '0.65rem', margin: '0.4rem 0 1rem' }}>
          <strong>{t.scheduledTime}</strong> {booking.dateTime}
        </div>
        
        {!isHistoryView && booking.status === 'pending' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')} 
              className="btn-delete"
            >
              {t.cancelRequest}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTutorBookingCard = (booking, isHistoryView) => {
    const cardStyle = isHistoryView 
      ? { opacity: 0.85, borderStyle: 'dashed', borderWidth: '1.5px', borderColor: 'rgba(0,0,0,0.15)' }
      : {};
    return (
      <div key={booking.id} className="card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-location" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>📚 {booking.subject}</span>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Student Request: {booking.studentName}</h3>
          </div>
          <span className={`badge badge-status ${booking.status}`}>
            {booking.status === 'pending' ? '審核中' : booking.status === 'confirmed' ? '已確認' : booking.status === 'completed' ? '已完成' : '已取消'}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--primary)', paddingLeft: '0.8rem', margin: '0.5rem 0 1.5rem' }}>
          <strong>{t.scheduledTime}</strong> {booking.dateTime}
        </div>

        {!isHistoryView && (
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
            {booking.status === 'pending' && (
              <>
                <button 
                  onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} 
                  className="btn-book" 
                  style={{ flexGrow: 1, padding: '0.4rem' }}
                >
                  {t.approveBooking}
                </button>
                <button 
                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')} 
                  className="btn-delete"
                  style={{ fontSize: '0.8rem' }}
                >
                  {t.rejectBooking}
                </button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <>
                <button 
                  onClick={() => handleUpdateBookingStatus(booking.id, 'completed')} 
                  className="btn-book" 
                  style={{ flexGrow: 1, padding: '0.4rem', background: 'var(--accent)' }}
                >
                  {t.completeBooking}
                </button>
                <button 
                  onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')} 
                  className="btn-delete"
                  style={{ fontSize: '0.8rem' }}
                >
                  {t.cancelBooking}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };


  // Global Auth Loading Screen
  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', justifyContent: 'center' }}>
          <h2>{t.checkingConnection}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Platform Announcement Banner */}
      {globalAnnouncement && showAnnouncement && (
        <div 
          className="system-announcement-banner"
          style={{
            background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
            color: '#ffffff',
            padding: '0.6rem 1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            borderBottom: '2px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flexGrow: 1 }}>
            <span style={{ fontSize: '1.1rem' }}>📢</span>
            <div style={{ display: 'inline-block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              <strong>系統公告：</strong> {globalAnnouncement}
            </div>
          </div>
          <button 
            className="announcement-close-btn"
            onClick={() => setShowAnnouncement(false)} 
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              opacity: 0.8,
              padding: '0 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
            title="關閉公告"
          >
            ×
          </button>
        </div>
      )}

      {/* Toast notifications */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        {toastMessage}
      </div>

      {/* Login Popup Modal (Only opens when triggered by restricted actions) */}
      {loginModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setLoginModalOpen(false)}>×</button>
            <div className="auth-header">
              <h2>{authMode === 'signin' ? t.authTitleSignIn : t.authTitleSignUp}</h2>
              <p style={{ marginBottom: '1rem' }}>{authMode === 'signin' ? t.authDescSignIn : t.authDescSignUp}</p>
            </div>

            {authError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', marginBottom: '1rem' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <>
                  <div className="auth-input-group">
                    <label>{t.labelName}</label>
                    <input 
                      type="text" 
                      placeholder="例如: 蘇老師" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="auth-input-group">
                    <label>註冊身份</label>
                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        <input 
                          type="radio" 
                          name="authRole" 
                          value="student" 
                          checked={authRole === 'student'} 
                          onChange={() => setAuthRole('student')}
                          style={{ width: 'auto', height: 'auto', margin: 0, padding: 0, accentColor: 'var(--primary)' }}
                        />
                        🎓 學生 / 家長
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        <input 
                          type="radio" 
                          name="authRole" 
                          value="tutor" 
                          checked={authRole === 'tutor'} 
                          onChange={() => setAuthRole('tutor')}
                          style={{ width: 'auto', height: 'auto', margin: 0, padding: 0, accentColor: 'var(--primary)' }}
                        />
                        💼 教育導師
                      </label>
                      {import.meta.env.DEV && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          <input 
                            type="radio" 
                            name="authRole" 
                            value="admin" 
                            checked={authRole === 'admin'} 
                            onChange={() => setAuthRole('admin')}
                            style={{ width: 'auto', height: 'auto', margin: 0, padding: 0, accentColor: 'var(--primary)' }}
                          />
                          👑 系統管理員
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="auth-input-group">
                <label>{t.labelEmail}</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>{t.labelPassword}</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              {authMode === 'signup' && smsVerificationEnabled && (
                <>
                  <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label>手機號碼 (Macau +853)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>+853</span>
                      <input 
                        type="tel" 
                        id="authPhoneInput"
                        placeholder="例如: 66123456" 
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        style={{ flex: 1 }}
                        required
                        disabled={otpVerified}
                      />
                      <button 
                        type="button" 
                        id="sendOtpBtn"
                        onClick={handleSendOtp} 
                        className="btn-book" 
                        style={{ padding: '0 1rem', fontSize: '0.85rem', margin: 0, minWidth: '90px' }}
                        disabled={otpVerified || isSendingOtp || authPhone.length !== 8}
                      >
                        {isSendingOtp ? "發送中..." : otpSent ? "重新發送" : "發送驗證碼"}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="auth-input-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label>簡訊驗證碼 (6位數)</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          id="authOtpInput"
                          placeholder="請輸入 6 位數驗證碼" 
                          value={authOtpCode}
                          onChange={(e) => setAuthOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          style={{ flex: 1 }}
                          required
                          disabled={otpVerified}
                        />
                        <button 
                          type="button" 
                          id="verifyOtpBtn"
                          onClick={handleVerifyOtp} 
                          className="btn-book" 
                          style={{ padding: '0 1rem', fontSize: '0.85rem', margin: 0, minWidth: '90px', backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)' }}
                          disabled={otpVerified || authOtpCode.length !== 6}
                        >
                          驗證驗證碼
                        </button>
                      </div>
                    </div>
                  )}

                  {otpVerificationMessage && (
                    <div style={{ fontSize: '0.8rem', color: otpVerified ? 'var(--secondary)' : 'var(--text-main)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                      {otpVerificationMessage}
                    </div>
                  )}

                  {otpError && (
                    <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                      {otpError}
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit" 
                className="btn-auth-submit"
                style={{
                  opacity: (authMode === 'signup' && smsVerificationEnabled && !otpVerified) ? 0.6 : 1,
                  cursor: (authMode === 'signup' && smsVerificationEnabled && !otpVerified) ? 'not-allowed' : 'pointer'
                }}
              >
                {authMode === 'signin' ? t.btnSignIn : t.btnSignUp}
              </button>
            </form>

            {import.meta.env.DEV && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleGuestLogin('student')} className="btn-auth-guest" style={{ flex: '1 1 30%', padding: '0.5rem 0', fontSize: '0.8rem' }}>
                  🎓 學生訪客
                </button>
                <button type="button" onClick={() => handleGuestLogin('tutor')} className="btn-auth-guest" style={{ flex: '1 1 30%', padding: '0.5rem 0', fontSize: '0.8rem' }}>
                  💼 導師訪客
                </button>
                <button type="button" onClick={() => handleGuestLogin('admin')} className="btn-auth-guest" style={{ flex: '1 1 30%', padding: '0.5rem 0', fontSize: '0.8rem', borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                  👑 管理員訪客
                </button>
              </div>
            )}

            <div className="auth-toggle-text" style={{ marginTop: '1rem' }}>
              {authMode === 'signin' ? (
                <>
                  <span>{t.toggleToSignUp}</span>
                  <button onClick={() => setAuthMode('signup')} className="auth-toggle-link">{t.btnSignUp}</button>
                </>
              ) : (
                <>
                  <span>{t.toggleToSignIn}</span>
                  <button onClick={() => setAuthMode('signin')} className="auth-toggle-link">{t.btnSignIn}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header (Language switchers removed, exclusive Traditional Chinese) */}
      <header className="navbar">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => handleStudentTabSwitch('all')}>
          <div className="logo-icon">🎓</div>
          <span>{t.brandName}</span>
        </div>

        {/* User state badge and status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {currentUser ? (
            <div className="user-badge" style={{ gap: '0.75rem' }}>
              <span className="badge" style={{
                background: userRole === 'admin' ? 'rgba(220, 38, 38, 0.08)' : userRole === 'tutor' ? 'var(--secondary-glow)' : 'rgba(29, 78, 216, 0.08)',
                color: userRole === 'admin' ? '#ef4444' : userRole === 'tutor' ? 'var(--secondary)' : 'var(--accent)',
                border: userRole === 'admin' ? '1px solid rgba(220, 38, 38, 0.2)' : userRole === 'tutor' ? '1px solid rgba(194, 155, 56, 0.2)' : '1px solid rgba(29, 78, 216, 0.2)',
                fontSize: '0.7rem'
              }}>
                {userRole === 'admin' ? '👑 系統管理員' : userRole === 'tutor' ? '💼 教育導師' : '🎓 學生 / 家長'}
              </span>
              <span>
                {(() => {
                  if (currentUser.displayName) {
                    try {
                      return JSON.parse(currentUser.displayName).name;
                    } catch (e) {
                      return currentUser.displayName;
                    }
                  }
                  return currentUser.email ? currentUser.email.split('@')[0] : "訪客";
                })()}
              </span>
              <button onClick={handleSignOut} className="btn-signout">{t.logout}</button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setAuthError('');
                setAuthMode('signin');
                setLoginModalOpen(true);
              }}
              className="btn-book"
              style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}
            >
              登入 / 註冊
            </button>
          )}

          <div className="nav-status" title={isApiSimulated ? t.apiOffline : t.apiConnected}>
            <span className={`status-indicator ${connectionStatus === 'online' ? 'online' : ''}`}></span>
            <span style={{ fontSize: '0.75rem' }}>
              {connectionStatus === 'checking' && t.checkingConnection}
              {connectionStatus === 'online' && t.apiConnected}
              {connectionStatus === 'offline' && t.apiOffline}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner (Portuguese Azulejo Tile design overlay) */}
      <section className="hero">
        <span className="hero-badge">{t.heroBadge}</span>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSubtitle}</p>

        {/* Student View tabs */}
        {userRole === 'student' && activeTab !== 'about' && activeTab !== 'policy' && (
          <div className="dashboard-controls">
            <button onClick={() => handleStudentTabSwitch('all')} className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}>{t.allStudentHub}</button>
            <button onClick={() => handleStudentTabSwitch('tutors')} className={`filter-btn ${activeTab === 'tutors' ? 'active' : ''}`}>{t.browseTutors}</button>
            {currentUser && (
              <button onClick={() => handleStudentTabSwitch('bookings')} className={`filter-btn ${activeTab === 'bookings' ? 'active' : ''}`}>
                {t.myBookings} ({studentBookings.length})
              </button>
            )}
            <button onClick={() => handleStudentTabSwitch('requests')} className={`filter-btn ${activeTab === 'requests' ? 'active' : ''}`}>{t.requestsBoard}</button>
          </div>
        )}

        {/* Tutor View tabs */}
        {userRole === 'tutor' && activeTab !== 'about' && activeTab !== 'policy' && (
          <div className="dashboard-controls">
            <button onClick={() => setActiveTab('tutor-profile')} className={`filter-btn ${activeTab === 'tutor-profile' ? 'active' : ''}`}>💼 我的教學檔案</button>
            <button onClick={() => setActiveTab('tutor-bookings')} className={`filter-btn ${activeTab === 'tutor-bookings' ? 'active' : ''}`}>📅 收到的預約申請 ({tutorReceivedBookings.length})</button>
            <button onClick={() => setActiveTab('tutor-requests')} className={`filter-btn ${activeTab === 'tutor-requests' ? 'active' : ''}`}>📋 瀏覽學生需求 ({requests.length})</button>
          </div>
        )}

        {/* Admin View tabs */}
        {userRole === 'admin' && activeTab !== 'about' && activeTab !== 'policy' && (
          <div className="dashboard-controls">
            <button onClick={() => setActiveTab('admin-overview')} className={`filter-btn ${activeTab === 'admin-overview' ? 'active' : ''}`}>📊 平台總覽與設定</button>
            <button onClick={() => setActiveTab('admin-tutors')} className={`filter-btn ${activeTab === 'admin-tutors' ? 'active' : ''}`}>👥 Tutors 導師管理 ({tutors.length})</button>
            <button onClick={() => setActiveTab('admin-bookings')} className={`filter-btn ${activeTab === 'admin-bookings' ? 'active' : ''}`}>📅 Bookings 預約管理 ({bookings.length})</button>
            <button onClick={() => setActiveTab('admin-requests')} className={`filter-btn ${activeTab === 'admin-requests' ? 'active' : ''}`}>📋 Requests 需求管理 ({requests.length})</button>
          </div>
        )}
      </section>

      {/* Main Dashboard Panel */}
      <main className="dashboard-main">
        {activeTab === 'about' && (
          <div className="card" style={{ padding: '2rem', maxWidth: '800px', margin: '1rem auto 3rem auto', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎓 關於我們 (About Us)
            </h2>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', color: 'var(--text-main)' }}>
              歡迎來到<strong>「澳門學生網」 (Macau Student Hub)</strong>！我們是澳門本土領先的家教與學生對接平台，致力於為全澳中小學生、家長以及優秀教育導師提供一個安全、高效、透明的媒合環境。
            </p>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', color: 'var(--text-main)' }}>
              不論您是正在尋找四校聯考輔導、國際學制（IB/IGCSE/A-Level）對接、還是外語學習（英語、葡萄牙語）的學生，或是具備專業教學資歷的導師，澳門學生網都能為您提供最優質的媒合對接服務。
            </p>
            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '1rem' }}>我們的願景</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', color: 'var(--text-main)' }}>
              推動澳門本地教育資源的優化配置，利用安全可靠的雲端認證技術，打破傳統家教中介資訊不透明的壁壘，讓教育回歸本質。
            </p>
            <button className="btn-book" style={{ marginTop: '1.5rem' }} onClick={() => setActiveTab('all')}>返回首頁</button>
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="card" style={{ padding: '2rem', maxWidth: '800px', margin: '1rem auto 3rem auto', width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📜 服務條款與隱私政策 (Terms & Policy)
            </h2>
            
            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. 服務條款</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              本平台僅提供學生與導師之間的資訊媒合服務。用戶在註冊與使用平台時，應提供真實且準確的個人資訊。所有教學預約與費用支付均由雙方直接協議進行，平台不承擔任何直接教學糾紛的法律責任。
            </p>

            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. 隱私政策與數據保護</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              我們高度重視您的隱私。您註冊時輸入的電子郵件、稱呼及教學檔案資料僅用於平台的對接匹配與身份核准。本平台使用安全可靠的 Firebase 認證技術，承諾不會將您的個人隱私數據洩露或銷售給任何第三方。
            </p>

            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. 平台媒合收費規則</h3>
            <p style={{ lineHeight: '1.8', marginBottom: '1.2rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              本平台採用公開、合理的收費機制。詳細學生收費說明及導師課酬支付指南請參閱平台對應門戶的說明頁面。
            </p>
            <button className="btn-book" style={{ marginTop: '1.5rem' }} onClick={() => setActiveTab('all')}>返回首頁</button>
          </div>
        )}

        {/* ================= STUDENT VIEW (PUBLIC EXPLORER) ================= */}
        {userRole === 'student' && activeTab !== 'about' && activeTab !== 'policy' && (
          <>
            {/* Tutor Explorer list (PUBLICLY ACCESSIBLE) */}
            {(activeTab === 'all' || activeTab === 'tutors') && (
              <section>
                <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <h2>{t.tutorTitle}</h2>
                    <p>{t.tutorSubtitle}</p>
                  </div>

                  {/* Filter selectors */}
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filterSubject}</label>
                      <select 
                        value={filterSubject} 
                        onChange={(e) => setFilterSubject(e.target.value)}
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', outline: 'none' }}
                      >
                        <option value="all">{t.allSubjects}</option>
                        {AVAILABLE_SUBJECTS.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filterLocation}</label>
                      <select 
                        value={filterLocation} 
                        onChange={(e) => setFilterLocation(e.target.value)}
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', outline: 'none' }}
                      >
                        <option value="all">{t.allLocations}</option>
                        <option value="Taipa">氹仔 (Taipa)</option>
                        <option value="Macau Peninsula">澳門半島</option>
                        <option value="Coloane">路環 (Coloane)</option>
                      </select>
                    </div>

                    {/* School Curriculum Filters */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filterCurriculum}</label>
                      <select 
                        value={filterCurriculum} 
                        onChange={(e) => setFilterCurriculum(e.target.value)}
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', outline: 'none' }}
                      >
                        <option value="all">{t.allCurriculums}</option>
                        <option value="Portuguese System">葡萄牙學制 (Exame Nacional)</option>
                        <option value="International System">國際學制 (IB / IGCSE / A-Levels)</option>
                        <option value="Macao / Mainland System">澳門/內地學制 (四校聯考 / DSE)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tutors Card grid */}
                <div className="grid-3">
                  {filteredTutors.length === 0 ? (
                    <div className="empty-state">{t.noTutors}</div>
                  ) : (
                    filteredTutors.map(tutor => (
                      <div key={tutor.id} className="card">
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{tutor.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tutor.education}</span>
                          </div>
                          <span className="rating">★ {tutor.rating}</span>
                        </div>

                        {/* Location and MOP Rate */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.4rem 0' }}>
                          <span className="badge badge-location">📍 {tutor.location === 'Taipa' ? '氹仔' : tutor.location === 'Coloane' ? '路環' : '澳門半島'}</span>
                          <span className="tutor-rate">{tutor.rate}{t.rateSuffix}</span>
                        </div>

                        {/* Curriculum tags list */}
                        <div style={{ margin: '0.35rem 0' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                            {t.filterCurriculum}:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {tutor.curriculums && tutor.curriculums.map((curr, cIdx) => (
                              <span 
                                key={cIdx} 
                                className="badge" 
                                style={{
                                  background: 'rgba(194, 155, 56, 0.08)',
                                  color: 'var(--secondary)',
                                  border: '1px solid rgba(194, 155, 56, 0.15)',
                                  textTransform: 'none',
                                  fontSize: '0.65rem',
                                  padding: '0.15rem 0.35rem'
                                }}
                              >
                                {curr.split(' (')[0]}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Subjects taught subtags */}
                        <div className="subjects-container">
                          {tutor.subjects.map((sub, idx) => (
                            <span key={idx} className="subject-tag">{sub}</span>
                          ))}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.4rem 0 1rem', flexGrow: 1 }}>{tutor.bio}</p>

                        {/* Interactive Bookings slots choice */}
                        <div className="booking-selector">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.filterSubject}</label>
                              <select 
                                className="booking-select" 
                                value={bookingSubject[tutor.id] || ''} 
                                onChange={(e) => handleSubjectChange(tutor.id, e.target.value)}
                              >
                                {tutor.subjects.map((sub, idx) => (
                                  <option key={idx} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.chooseTime}</label>
                              <select 
                                className="booking-select"
                                value={selectedSlots[tutor.id] || ''} 
                                onChange={(e) => handleSlotChange(tutor.id, e.target.value)}
                              >
                                {tutor.availableSlots.map((slot, idx) => (
                                  <option key={idx} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button onClick={() => handleCreateBooking(tutor)} className="btn-book">
                            {t.bookBtn}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Tab 2: Student Bookings Dashboard */}
            {(activeTab === 'bookings') && (
              <section>
                <div className="section-header">
                  <h2>{t.bookingsTitle}</h2>
                  <p>{t.bookingsSubtitle}</p>
                </div>

                <div style={{ backgroundColor: 'rgba(238, 204, 136, 0.15)', borderLeft: '4px solid var(--accent)', padding: '1.2rem 1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    💰 我們如何收費 (How We Charge)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    <strong>收費標準</strong>：本平台向學生/家長收取一次性家教對接服務費（媒合佣金），佣金金額為該導師<strong>兩週的授課薪酬</strong>（即前兩週的約定學費作為平台服務費，家長及學生無須額外支付其他平台服務費）。<br />
                    <strong>繳費方式</strong>：您的預約申請經導師核准接受後，平台客服人員將會與您取得聯絡，指引您通過澳門本地銀行轉帳或 MPay 支付媒合費。完成支付後，課程將正式開展並獲得平台全程對接保障。
                  </p>
                </div>
                
                {studentBookings.length === 0 ? (
                  <div className="empty-state">目前沒有您的預約記錄</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem', borderBottom: '2px solid var(--primary-glow)', paddingBottom: '0.5rem' }}>
                        ⏳ 進行中預約
                      </h3>
                      {activeStudentBookings.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>目前沒有進行中的預約</div>
                      ) : (
                        <div className="grid-2">
                          {activeStudentBookings.map(booking => renderBookingCard(booking, false))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                        📜 歷史預約記錄
                      </h3>
                      {historyStudentBookings.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>目前沒有歷史預約記錄</div>
                      ) : (
                        <div className="grid-2">
                          {historyStudentBookings.map(booking => renderBookingCard(booking, true))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Tab 3: Match Requests Board */}
            {(activeTab === 'all' || activeTab === 'requests') && (
              <section style={{ marginTop: '2.5rem' }}>
                <div className="section-header">
                  <h2>{t.postRequestTitle}</h2>
                  <p>{t.postRequestSubtitle}</p>
                </div>

                <div className="notes-container">
                  {/* Form to submit request */}
                  <form onSubmit={handleAddRequest} className="note-form">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--primary)' }}>{t.newRequestForm}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.formReqTitle}</label>
                      <input
                        type="text"
                        placeholder="例如: 四校聯考數學科急需輔導"
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.filterSubject}</label>
                        <select value={reqSubject} onChange={(e) => setReqSubject(e.target.value)}>
                          {AVAILABLE_SUBJECTS.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.formReqBudget}</label>
                        <input
                          type="number"
                          placeholder="例如: 300"
                          value={reqBudget}
                          onChange={(e) => setReqBudget(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.formReqDesc}</label>
                      <textarea
                        placeholder="描述您的年級、學校系統體系、預期授課地點與時間..."
                        value={reqDescription}
                        onChange={(e) => setReqDescription(e.target.value)}
                        maxLength={200}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-submit">{t.formSubmit}</button>
                  </form>

                  {/* Request Cards Grid (Publicly visible) */}
                  <div className="notes-grid">
                    {requests.length === 0 ? (
                      <div className="empty-state">{t.noRequests}</div>
                    ) : (
                      requests.map(req => (
                        <div key={req.id} className="note-card">
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <div className="note-tag study" style={{ marginBottom: 0 }}>
                                {req.subject}
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                {req.budget} MOP/hr
                              </span>
                            </div>
                            <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{req.title}</h4>
                            <p className="note-content" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.description}</p>
                          </div>

                          <div className="note-actions">
                            <span className="note-date">{t.postDate} {req.date}</span>
                            {currentUser && (
                              <button onClick={() => handleDeleteRequest(req.id)} className="btn-delete">
                                {t.deleteBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ================= TUTOR PORTAL VIEW (SECURE PORTAL) ================= */}
        {userRole === 'tutor' && currentUser && activeTab !== 'about' && activeTab !== 'policy' && (
          <div className="notes-container" style={{ gridTemplateColumns: '1fr', gap: '0' }}>
            
            {/* Tab 1: Onboarding form / Teaching Profile */}
            {activeTab === 'tutor-profile' && (
              <div className="note-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.75rem', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--primary)' }}>{t.tutorFormTitle}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.tutorFormSubtitle}</p>
                </div>

                {myRegisteredTutor && myRegisteredTutor.isApproved === false && (
                  <div className="verification-warning-banner" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span>⏳</span>
                    <div>
                      <strong>審核中</strong>：您的教學檔案目前正在審核中。管理員批准後，您的檔案將會展示在首頁目錄，並開放學生預約。
                    </div>
                  </div>
                )}

                {isEditingTutor ? (
                  <form onSubmit={handleRegisterTutor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorName}</label>
                      <input
                        type="text"
                        placeholder="e.g. 蘇老師"
                        value={tutorNameForm}
                        onChange={(e) => setTutorNameForm(e.target.value)}
                        required
                      />
                    </div>

                    {/* Hourly Rate and preferred region */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorRate}</label>
                        <input
                          type="number"
                          placeholder="e.g. 300"
                          value={tutorRateForm}
                          onChange={(e) => setTutorRateForm(e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorLoc}</label>
                        <select value={tutorLocForm} onChange={(e) => setTutorLocForm(e.target.value)}>
                          <option value="Taipa">氹仔</option>
                          <option value="Macau Peninsula">澳門半島</option>
                          <option value="Coloane">路環</option>
                        </select>
                      </div>
                    </div>

                    {/* Qualifications */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorEdu}</label>
                      <input
                        type="text"
                        placeholder="例如: 澳門大學數學系學士"
                        value={tutorEduForm}
                        onChange={(e) => setTutorEduForm(e.target.value)}
                        required
                      />
                    </div>

                    {/* Curriculums Selection checkboxes */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t.tutorCurriculums} (最少選擇一項)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.3rem', marginBottom: '0.8rem' }}>
                        {CURRICULUM_OPTIONS.map((curr, idx) => (
                          <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <input
                              type="checkbox"
                              checked={tutorCurriculumsForm.includes(curr)}
                              onChange={() => handleCurriculumCheckbox(curr)}
                              style={{ marginTop: '3px' }}
                            />
                            <span>
                              {idx === 0 ? "葡萄牙學制 (Exame Nacional)" : idx === 1 ? "國際學制 (IB / IGCSE / A-Levels)" : "澳門/內地學制 (四校聯考 / DSE)"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Subjects checkboxes */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t.tutorSubjects} (最少選擇一項)</label>
                      <div className="checkbox-grid">
                        {AVAILABLE_SUBJECTS.map((subject, idx) => (
                          <label key={idx} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={tutorSubjectsForm.includes(subject)}
                              onChange={() => handleSubjectCheckbox(subject)}
                            />
                            <span>{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Availability slots input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorSlots}</label>
                      <div className="slots-input-group">
                        <input
                          type="text"
                          placeholder="例如: 星期六 14:00 - 16:00"
                          value={slotInputForm}
                          onChange={(e) => setSlotInputForm(e.target.value)}
                        />
                        <button type="button" onClick={handleAddSlot} className="btn-add-slot">+</button>
                      </div>
                      {/* Render availability slot tags list */}
                      <div className="slots-list">
                        {addedSlotsForm.map((slot, idx) => (
                          <span key={idx} className="slot-tag">
                            {slot}
                            <button type="button" onClick={() => handleRemoveSlot(slot)} className="btn-remove-slot">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bio */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.tutorBio}</label>
                      <textarea
                        placeholder="簡短描述您的教學大綱、溫習策略及教學習慣..."
                        value={tutorBioForm}
                        onChange={(e) => setTutorBioForm(e.target.value)}
                        style={{ minHeight: '80px' }}
                      />
                    </div>

                    <button type="submit" className="btn-submit">{t.btnPublish}</button>
                    {myRegisteredTutor && (
                      <button type="button" onClick={() => setIsEditingTutor(false)} className="btn-delete" style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {t.btnCancelEdit}
                      </button>
                    )}
                  </form>
                ) : (
                  // Display registered card
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ border: '1.5px solid var(--primary)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: 'var(--primary)' }}>{myRegisteredTutor.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {myRegisteredTutor.id}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.4rem 0' }}>{myRegisteredTutor.education}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem', marginBottom: '0.6rem' }}>
                        <span>📍 {myRegisteredTutor.location === 'Taipa' ? '氹仔' : '澳門半島'}</span>
                        <strong style={{ color: 'var(--primary)' }}>{myRegisteredTutor.rate}{t.rateSuffix}</strong>
                      </div>

                      <div style={{ margin: '0.4rem 0' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t.filterCurriculum}:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                          {myRegisteredTutor.curriculums.map((c, i) => (
                            <span key={i} className="badge" style={{ background: 'rgba(194, 155, 56, 0.08)', color: 'var(--secondary)', border: '1px solid rgba(194, 155, 56, 0.15)', textTransform: 'none' }}>{c.split(' (')[0]}</span>
                          ))}
                        </div>
                      </div>

                      <div className="subjects-container" style={{ margin: '0.4rem 0' }}>
                        {myRegisteredTutor.subjects.map((sub, idx) => (
                          <span key={idx} className="subject-tag">{sub}</span>
                        ))}
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                        "{myRegisteredTutor.bio}"
                      </p>

                      <div style={{ marginTop: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t.tutorSlots}:</span>
                        <div className="slots-list">
                          {myRegisteredTutor.availableSlots.map((s, i) => (
                            <span key={i} className="slot-tag" style={{ borderStyle: 'solid' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setTutorNameForm(myRegisteredTutor.name);
                        setTutorEduForm(myRegisteredTutor.education);
                        setTutorRateForm(myRegisteredTutor.rate);
                        setTutorLocForm(myRegisteredTutor.location);
                        setTutorBioForm(myRegisteredTutor.bio);
                        setTutorSubjectsForm(myRegisteredTutor.subjects);
                        setTutorCurriculumsForm(myRegisteredTutor.curriculums);
                        setAddedSlotsForm(myRegisteredTutor.availableSlots);
                        setIsEditingTutor(true);
                      }} 
                      className="btn-submit"
                    >
                      {t.btnEdit}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Received Booking requests */}
            {activeTab === 'tutor-bookings' && (
              <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
                <div className="section-header">
                  <h2>{t.bookingReceivedTitle}</h2>
                  <p>{t.bookingReceivedSubtitle}</p>
                </div>

                <div style={{ backgroundColor: 'rgba(238, 204, 136, 0.15)', borderLeft: '4px solid var(--accent)', padding: '1.2rem 1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <h4 style={{ color: 'var(--primary)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    💰 課酬收款與平台佣金說明 (How You Get Paid)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    <strong>課酬發放</strong>：所有課酬由家長直接與您約定並直接支付給您（例如每週或每月結束時通過現金、本地銀行轉帳或 MPay 支付）。本平台不經手、亦不代扣您的日常課酬。<br />
                    <strong>平台對接佣金</strong>：當您確認接受學生的課程預約後，需向平台支付一次性的媒合服務費（金額等同於該預約項目首兩週的課酬時薪價值）。平台客服將聯繫您辦理轉帳，佣金確認後該預約即受平台正式保障。
                  </p>
                </div>

                {tutorReceivedBookings.length === 0 ? (
                  <div className="empty-state">
                    {t.noReceivedBookings}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem', borderBottom: '2px solid var(--primary-glow)', paddingBottom: '0.5rem' }}>
                        ⏳ 待處理與進行中預約
                      </h3>
                      {activeTutorBookings.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>目前沒有待處理或進行中的預約</div>
                      ) : (
                        <div className="grid-2" style={{ gridTemplateColumns: '1fr' }}>
                          {activeTutorBookings.map(booking => renderTutorBookingCard(booking, false))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                        📜 歷史對接記錄
                      </h3>
                      {historyTutorBookings.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>目前沒有歷史對接記錄</div>
                      ) : (
                        <div className="grid-2" style={{ gridTemplateColumns: '1fr' }}>
                          {historyTutorBookings.map(booking => renderTutorBookingCard(booking, true))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Public Student Requests Board (View Only for Tutors) */}
            {activeTab === 'tutor-requests' && (
              <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                <div className="section-header">
                  <h2>學生家教需求配對板 (唯讀模式)</h2>
                  <p>查看澳門學生發佈的各學科輔導需求與課酬預算</p>
                </div>
                <div className="notes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {requests.length === 0 ? (
                    <div className="empty-state">{t.noRequests}</div>
                  ) : (
                    requests.map(req => (
                      <div key={req.id} className="note-card" style={{ minHeight: '170px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <div className="note-tag study" style={{ marginBottom: 0 }}>
                              {req.subject}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                              {req.budget} MOP/小時
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{req.title}</h4>
                          <p className="note-content" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.description}</p>
                        </div>
                        <div className="note-actions">
                          <span className="note-date">{t.postDate} {req.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= ADMIN PORTAL VIEW (SECURE PORTAL) ================= */}
        {userRole === 'admin' && currentUser && activeTab !== 'about' && activeTab !== 'policy' && (
          <div className="admin-portal-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            
            {/* Overview & Settings Tab */}
            {activeTab === 'admin-overview' && (
              <div className="admin-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="section-header" style={{ borderLeft: '3px solid var(--primary)' }}>
                  <h2>📊 澳門師生港平台總覽</h2>
                  <p>查看系統的運作數據統計及修改全局控制變數設定</p>
                </div>

                {/* Metrics Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  
                  {/* Card 1: Tutors */}
                  <div className="card" style={{ 
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
                    color: '#ffffff', 
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 'bold' }}>👥 導師審核統計</span>
                    <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#ffffff' }}>{totalTutorsCount} 名</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>已認證: {approvedTutorsCount} | 待審核: {pendingTutorsCount}</span>
                  </div>

                  {/* Card 2: Bookings */}
                  <div className="card" style={{ 
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)', 
                    color: '#ffffff', 
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 'bold' }}>📅 課程預約數</span>
                    <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#ffffff' }}>{totalBookingsCount} 次</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>進行中: {pendingBookingsCount + confirmedBookingsCount} | 歷史: {completedBookingsCount + cancelledBookingsCount}</span>
                  </div>

                  {/* Card 3: Match Requests */}
                  <div className="card" style={{ 
                    background: 'linear-gradient(135deg, #b45309, #92400e)', 
                    color: '#ffffff', 
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 'bold' }}>📋 活躍配對需求</span>
                    <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#ffffff' }}>{totalRequestsCount} 筆</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>當前發佈於家教需求板之配對數</span>
                  </div>

                  {/* Card 4: Platform Volume */}
                  <div className="card" style={{ 
                    background: 'linear-gradient(135deg, #0369a1, #075985)', 
                    color: '#ffffff', 
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '120px'
                  }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 'bold' }}>💰 平台課酬流水</span>
                    <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#ffffff' }}>{totalVolume} MOP</h3>
                    <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>預計平台抽成 (以 {globalCommission} 週薪計算): {totalCommission} MOP</span>
                  </div>

                </div>

                {/* Global Settings Panel */}
                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>⚙️ 平台全局系統設定</h3>
                  <form onSubmit={handleSaveGlobalSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      
                      {/* Commission weeks setting */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label htmlFor="commissionInput" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          平台佣金收費標準 (以導師週薪週數為單位)
                        </label>
                        <input
                          id="commissionInput"
                          type="number"
                          min="0"
                          max="12"
                          value={globalCommission}
                          onChange={(e) => setGlobalCommission(Number(e.target.value))}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem'
                          }}
                          required
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          設定預估抽成的週數（例：2 週）。系統將按每筆預約的「導師時薪 × 每週課時 × 設定週數」計算平台抽成。
                        </span>
                      </div>

                      {/* Announcement text setting */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label htmlFor="announcementInput" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          緊急系統公告內容 (若空白則自動隱藏公告欄)
                        </label>
                        <textarea
                          id="announcementInput"
                          placeholder="例如：平台將於 2026 年 6 月 6 日進行夜間系統升級..."
                          value={globalAnnouncement}
                          onChange={(e) => setGlobalAnnouncement(e.target.value)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem',
                            minHeight: '80px',
                            resize: 'vertical'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          設定後，系統公告條將以紅色高亮狀態橫置於所有訪問用戶的首頁頂端。
                        </span>
                      </div>

                      {/* Google Tracking Script setting */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <label htmlFor="trackingScriptInput" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          Google Analytics / Tag Manager 追蹤腳本 (Google Tracking Script)
                        </label>
                        <textarea
                          id="trackingScriptInput"
                          placeholder="請在此貼入您的 Google Analytics (gtag.js) 或 Google Tag Manager 追蹤代碼，包含完整的 <script> ... </script> 標籤..."
                          value={googleTrackingScript}
                          onChange={(e) => setGoogleTrackingScript(e.target.value)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            minHeight: '120px',
                            resize: 'vertical'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          在儲存後，平台將動態解析並注入此腳本至網頁頂端 Head 節點中，無須重新編譯。
                        </span>
                      </div>

                      {/* SMS Verification setting */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', gridColumn: '1 / -1', marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <input
                          id="smsVerificationToggle"
                          type="checkbox"
                          checked={smsVerificationEnabled}
                          onChange={(e) => setSmsVerificationEnabled(e.target.checked)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: 'var(--primary)',
                            margin: 0
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <label htmlFor="smsVerificationToggle" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', cursor: 'pointer' }}>
                            啟用註冊手機簡訊驗證 (CTM SMS Verification)
                          </label>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            開啟後，新用戶註冊（學生或導師）時必須通過 8 位數澳門手機號碼的簡訊驗證碼驗證（當前使用 CTM SMS 模擬對接）。
                          </span>
                        </div>
                      </div>

                    </div>

                    <button 
                      type="submit" 
                      className="btn-submit" 
                      style={{ 
                        maxWidth: '200px', 
                        alignSelf: 'flex-start',
                        marginTop: '0.5rem',
                        padding: '0.6rem 1.2rem'
                      }}
                    >
                      💾 儲存全局設定
                    </button>

                  </form>
                </div>

              </div>
            )}

            {/* Tutors Management Tab */}
            {activeTab === 'admin-tutors' && (
              <div className="admin-section">
                <div className="section-header" style={{ borderLeft: '3px solid var(--secondary)' }}>
                  <h2>Tutors 導師目錄管理</h2>
                  <p>管理所有入駐導師的檔案資訊、時薪及授課學制體系</p>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>編號</th>
                        <th>導師姓名</th>
                        <th>學歷背景</th>
                        <th>教授科目 / 學制</th>
                        <th>時薪</th>
                        <th>授課地區</th>
                        <th>審核狀態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutors.map((tutor) => (
                        <tr key={tutor.id}>
                          <td><code>{tutor.id}</code></td>
                          <td><strong>{tutor.name}</strong></td>
                          <td style={{ maxWidth: '200px', fontSize: '0.8rem' }}>{tutor.education}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                {tutor.subjects.map((sub, i) => (
                                  <span key={i} className="subject-tag" style={{ fontSize: '0.65rem', padding: '0px 0.3rem' }}>{sub}</span>
                                ))}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                {tutor.curriculums.map((curr, i) => (
                                  <span key={i} className="badge" style={{ fontSize: '0.6rem', padding: '0px 0.2rem', background: 'var(--secondary-glow)', color: 'var(--secondary)' }}>{curr.split(' (')[0]}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td><strong style={{ color: 'var(--primary)' }}>{tutor.rate} MOP</strong></td>
                          <td>{tutor.location === 'Taipa' ? '氹仔' : tutor.location === 'Coloane' ? '路環' : '澳門半島'}</td>
                          <td>
                            {tutor.isApproved === true ? (
                              <span className="badge badge-status confirmed" style={{ fontSize: '0.7rem' }}>已認證</span>
                            ) : (
                              <span className="badge badge-status pending" style={{ fontSize: '0.7rem' }}>待審核</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {tutor.isApproved === false && (
                                <button 
                                  onClick={() => handleAdminApproveTutor(tutor.id)} 
                                  className="btn-book" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                                >
                                  核准
                                </button>
                              )}
                              <button onClick={() => handleEditClick('tutor', tutor)} className="btn-book" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>編輯</button>
                              <button onClick={() => handleDeleteClick('tutor', tutor.id)} className="btn-delete" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>刪除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bookings Management Tab */}
            {activeTab === 'admin-bookings' && (
              <div className="admin-section">
                <div className="section-header" style={{ borderLeft: '3px solid var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2>Bookings 預約課程管理</h2>
                    <p>管理學生的課程預約、上課時段及審核狀態</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="adminBookingFilter" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>篩選狀態:</label>
                    <select
                      id="adminBookingFilter"
                      value={adminBookingFilter}
                      onChange={(e) => setAdminBookingFilter(e.target.value)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--card-bg)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="all">所有預約 (All)</option>
                      <option value="active">進行中 (Active)</option>
                      <option value="history">歷史記錄 (History)</option>
                    </select>
                  </div>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>編號</th>
                        <th>學生姓名</th>
                        <th>對接導師</th>
                        <th>預約科目</th>
                        <th>授課時段</th>
                        <th>當前狀態</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td><code>{booking.id}</code></td>
                          <td><strong>{booking.studentName}</strong></td>
                          <td>{booking.tutorName} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({booking.tutorId})</span></td>
                          <td><span className="subject-tag" style={{ fontSize: '0.7rem' }}>{booking.subject}</span></td>
                          <td><code style={{ fontSize: '0.8rem' }}>{booking.dateTime}</code></td>
                          <td>
                            <span className={`badge badge-status ${booking.status}`}>
                              {booking.status === 'pending' ? '審核中' : booking.status === 'confirmed' ? '已確認' : booking.status === 'completed' ? '已完成' : '已取消'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => handleEditClick('booking', booking)} className="btn-book" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>編輯</button>
                              <button onClick={() => handleDeleteClick('booking', booking.id)} className="btn-delete" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>刪除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Requests Management Tab */}
            {activeTab === 'admin-requests' && (
              <div className="admin-section">
                <div className="section-header" style={{ borderLeft: '3px solid var(--secondary)' }}>
                  <h2>Requests 學生需求管理</h2>
                  <p>管理發佈在配對板上的家教配對要求、目標預算和詳細描述</p>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>編號</th>
                        <th>需求標題</th>
                        <th>科目</th>
                        <th>預算</th>
                        <th>發佈日期</th>
                        <th>詳細描述</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((reqItem) => (
                        <tr key={reqItem.id}>
                          <td><code>{reqItem.id}</code></td>
                          <td><strong>{reqItem.title}</strong></td>
                          <td><span className="subject-tag" style={{ fontSize: '0.7rem' }}>{reqItem.subject}</span></td>
                          <td><strong style={{ color: 'var(--primary)' }}>{reqItem.budget} MOP</strong></td>
                          <td><code style={{ fontSize: '0.8rem' }}>{reqItem.date}</code></td>
                          <td style={{ maxWidth: '250px', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={reqItem.description}>{reqItem.description}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button onClick={() => handleEditClick('request', reqItem)} className="btn-book" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>編輯</button>
                              <button onClick={() => handleDeleteClick('request', reqItem.id)} className="btn-delete" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>刪除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Admin Record Editing Modal Overlay */}
      {adminEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setAdminEditModalOpen(false)}>×</button>
            <div className="auth-header">
              <h2>編輯{adminEditType === 'tutor' ? '導師檔案' : adminEditType === 'booking' ? '預約課程' : '配對需求'}</h2>
              <p style={{ marginBottom: '1rem' }}>修改記錄編號: <code>{adminEditId}</code></p>
            </div>

            <form onSubmit={handleAdminEditSubmit} className="auth-form" style={{ gap: '1rem' }}>
              
              {/* Tutor Fields */}
              {adminEditType === 'tutor' && (
                <>
                  <div className="auth-input-group">
                    <label>導師姓名</label>
                    <input type="text" value={adminEditTutorName} onChange={(e) => setAdminEditTutorName(e.target.value)} required />
                  </div>
                  <div className="auth-input-group">
                    <label>學歷背景</label>
                    <input type="text" value={adminEditTutorEdu} onChange={(e) => setAdminEditTutorEdu(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="auth-input-group">
                      <label>時薪 (MOP/小時)</label>
                      <input type="number" value={adminEditTutorRate} onChange={(e) => setAdminEditTutorRate(e.target.value)} required />
                    </div>
                    <div className="auth-input-group">
                      <label>授課地區</label>
                      <select value={adminEditTutorLoc} onChange={(e) => setAdminEditTutorLoc(e.target.value)}>
                        <option value="Taipa">氹仔</option>
                        <option value="Coloane">路環</option>
                        <option value="Macau Peninsula">澳門半島</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="auth-input-group">
                    <label>熟習學制體系</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                      {CURRICULUM_OPTIONS.map((curr, idx) => (
                        <label key={idx} className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <input
                            type="checkbox"
                            checked={adminEditTutorCurriculums.includes(curr)}
                            onChange={() => handleAdminEditCurriculumCheckbox(curr)}
                            style={{ marginTop: '3px' }}
                          />
                          <span>
                            {idx === 0 ? "葡萄牙學制 (Exame Nacional)" : idx === 1 ? "國際學制 (IB / IGCSE / A-Levels)" : "澳門/內地學制 (四校聯考 / DSE)"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>教授科目</label>
                    <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
                      {AVAILABLE_SUBJECTS.map((subject, idx) => (
                        <label key={idx} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={adminEditTutorSubjects.includes(subject)}
                            onChange={() => handleAdminEditSubjectCheckbox(subject)}
                          />
                          <span>{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>可授課時段</label>
                    <div className="slots-input-group">
                      <input
                        type="text"
                        placeholder="例如: Sat 10:00 - 12:00"
                        value={adminEditTutorSlotInput}
                        onChange={(e) => setAdminEditTutorSlotInput(e.target.value)}
                      />
                      <button type="button" onClick={handleAdminEditAddSlot} className="btn-add-slot">+</button>
                    </div>
                    <div className="slots-list">
                      {adminEditTutorSlots.map((slot, idx) => (
                        <span key={idx} className="slot-tag">
                          {slot}
                          <button type="button" onClick={() => handleAdminEditRemoveSlot(slot)} className="btn-remove-slot">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>個人簡介</label>
                    <textarea value={adminEditTutorBio} onChange={(e) => setAdminEditTutorBio(e.target.value)} style={{ minHeight: '80px' }} required />
                  </div>

                  <div className="auth-input-group">
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '0.4rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={adminEditTutorApproved}
                        onChange={(e) => setAdminEditTutorApproved(e.target.checked)}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>批准此導師入駐並展示於首頁目錄</span>
                    </label>
                  </div>
                </>
              )}

              {/* Booking Fields */}
              {adminEditType === 'booking' && (
                <>
                  <div className="auth-input-group">
                    <label>學生姓名</label>
                    <input type="text" value={adminEditBookingStudent} onChange={(e) => setAdminEditBookingStudent(e.target.value)} required />
                  </div>
                  <div className="auth-input-group">
                    <label>預約科目</label>
                    <select value={adminEditBookingSubject} onChange={(e) => setAdminEditBookingSubject(e.target.value)}>
                      {AVAILABLE_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                  <div className="auth-input-group">
                    <label>授課時段</label>
                    <input type="text" value={adminEditBookingDateTime} onChange={(e) => setAdminEditBookingDateTime(e.target.value)} required />
                  </div>
                  <div className="auth-input-group">
                    <label>預約狀態</label>
                    <select value={adminEditBookingStatus} onChange={(e) => setAdminEditBookingStatus(e.target.value)}>
                      <option value="pending">審核中 (pending)</option>
                      <option value="confirmed">已確認 (confirmed)</option>
                      <option value="completed">已完成 (completed)</option>
                      <option value="cancelled">已取消 (cancelled)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Match Request Fields */}
              {adminEditType === 'request' && (
                <>
                  <div className="auth-input-group">
                    <label>需求標題</label>
                    <input type="text" value={adminEditRequestTitle} onChange={(e) => setAdminEditRequestTitle(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="auth-input-group">
                      <label>科目</label>
                      <select value={adminEditRequestSubject} onChange={(e) => setAdminEditRequestSubject(e.target.value)}>
                        {AVAILABLE_SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div className="auth-input-group">
                      <label>目標預算 (MOP/小時)</label>
                      <input type="number" value={adminEditRequestBudget} onChange={(e) => setAdminEditRequestBudget(e.target.value)} required />
                    </div>
                  </div>
                  <div className="auth-input-group">
                    <label>詳細描述</label>
                    <textarea value={adminEditRequestDesc} onChange={(e) => setAdminEditRequestDesc(e.target.value)} style={{ minHeight: '100px' }} required />
                  </div>
                </>
              )}

              <button type="submit" className="btn-auth-submit" style={{ marginTop: '0.5rem' }}>儲存修改</button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 1rem' }}>
        <p>{t.copyright}</p>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
          <button onClick={() => setActiveTab('about')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>關於我們</button>
          <span>|</span>
          <button onClick={() => setActiveTab('policy')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>服務條款與隱私政策</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
