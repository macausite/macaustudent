# Macau Student Hub: Business Flow & Transaction Lifecycle

This document describes the operational flow, matching lifecycle, and commercial model of the **澳門學生網 | Macau Student Hub** platform.

---

## 1. Process Lifecycle Diagram

Below is the matching lifecycle diagram showing the interactions between Students, Tutors, and System Administrators.

![Macau Student Hub Matching Processes](./business_flow_diagram.png)

---

## 2. Dynamic Transaction Sequence

This Mermaid sequence diagram illustrates the user actions, database events, verification steps, and fee processing steps for a successful match:

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student/Parent
    actor Tutor as Tutor
    actor Admin as Platform Admin
    participant DB as Backend Database (Firestore/Local JSON)

    %% Step 1: Onboarding
    Note over Student, Tutor: Phase 1: Onboarding & Verification
    Tutor->>DB: Register Account & Publish Teaching Profile
    DB-->>Admin: Notify: New Tutor Pending Review
    Admin->>DB: Review Credentials & Approve Tutor
    DB-->>Tutor: Status updated to "已認證" (Verified)
    DB-->>Student: Tutor visible in public Directory Explorer

    %% Step 2: Match Request or Direct Booking
    Note over Student, Tutor: Phase 2: Booking and Matchmaking
    Student->>DB: Option A: Post Learning Request on Board
    Tutor->>DB: Option B: Direct Book slot on Verified Tutor Card
    DB-->>Tutor: Notify: Booking Request Received (Pending status)

    %% Step 3: Confirmation and Commission Settlement
    Note over Tutor, Admin: Phase 3: Acceptance & Commission Processing
    Tutor->>DB: Accept student's Booking Request
    DB-->>Admin: Notify: Booking Accepted, Commission Payment Required
    Admin->>Student: Contact to request Matching Fee payment
    Note over Student, Admin: Commission = 2 weeks of tutor salary ( hourly_rate * hours_per_week * 2 )
    Student->>Admin: Pay commission via local Bank Transfer / MPay
    Admin->>DB: Mark Booking status as "Confirmed" (已確認)
    
    %% Step 4: Class Commencement
    Note over Student, Tutor: Phase 4: Course Start
    DB-->>Student: Match complete! Contact details unlocked
    DB-->>Tutor: Class scheduled. Teach student.
    Student->>Tutor: Pay recurring tutor salary directly (cash/MPay)
```

---

## 3. Detailed Business Flow Steps

### Phase 1: Tutor Vetting & Verification
1. **Registration**: Tutors sign up and submit academic backgrounds, qualifications, Peninsula/Taipa/Coloane region preferences, familiar curricula (IB, IGCSE, Joint Entrance Exam), hourly rate in MOP, and bios.
2. **Pending State**: The profile is initially flag-restricted (`isApproved: false`). Tutors see a pending status banner, and the profile remains invisible to students searching the directory.
3. **Admin Verification**: Admins review qualifications in the control panel and click **「核准」 (Approve)**. The status updates to `✅ 已認證` and the profile becomes publicly discoverable.

### Phase 2: Session Booking or Matching Boards
* **Direct Booking**: Students browse the verified directory, filter by subject/location/curriculum, select an available slot, and submit a booking request.
* **Match Requests**: Alternatively, students post learning requirements (e.g., "Prep for IELTS speaking, Taipa region, Budget 250 MOP/hr") to the public **需求配對板 (Match Board)**, where tutors can review and contact them.

### Phase 3: Commission Charging & Payment Settlement
1. **Commission Model**: The platform charges an **escrow matching fee (commission)** equal to **two weeks of the tutor's teaching salary**.
   * *Formula*: `Commission = tutor_hourly_rate * booking_session_duration * weekly_lessons * 2`
2. **Platform Invoicing**: Once a tutor accepts a booking request, the booking is set to `Pending Payment`. The platform admin coordinates with the parent/student.
3. **Local Payment Collection**: Payment is settled via Macau local bank transfer or MPay. 
4. **Activation**: Once the admin marks the booking as confirmed (`confirmed`) in the portal, the tutor and student details are unlocked.

### Phase 4: Course Delivery & Regular Salary
* **Direct Payments**: Tutors deliver classes according to schedule.
* **Zero Platform Deductions**: The student pays the tutor's salary directly (cash, MPay, or bank transfer) at the end of each session/month. The platform does not touch or deduct any portion of ongoing tutor earnings.
