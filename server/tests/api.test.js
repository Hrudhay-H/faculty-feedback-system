const test = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:5000/api';

// Shared state for storing JWT tokens and seeded model IDs
let adminToken = '';
let faculty1Token = ''; // Dr. John Smith (instructs CS301)
let faculty2Token = ''; // Dr. Alice Johnson (instructs CS302)
let student1Token = ''; // Enrolled in CS301
let student2Token = ''; // Not enrolled in CS301 (we will verify gates)
let courseIdCS301 = ''; // Database Management Systems
let courseIdCS302 = ''; // Analysis of Algorithms
let questionId = '';

test.describe('Faculty Feedback System - API Integration Tests', () => {

  // =========================================================================
  // 1. AUTHENTICATION & LOGIN
  // =========================================================================
  test('1.1 Login fails with invalid credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'wrongpassword' })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, 'Invalid email or password');
  });

  test('1.2 Login succeeds for Admin, Faculty, and Students', async () => {
    // Admin login
    const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu', password: 'adminpassword' })
    });
    assert.strictEqual(resAdmin.status, 200);
    const dataAdmin = await resAdmin.json();
    assert.strictEqual(dataAdmin.success, true);
    assert.ok(dataAdmin.data.token);
    adminToken = dataAdmin.data.token;

    // Faculty 1 login (Dr. John Smith)
    const resFac1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.smith@university.edu', password: 'facultypassword' })
    });
    assert.strictEqual(resFac1.status, 200);
    const dataFac1 = await resFac1.json();
    faculty1Token = dataFac1.data.token;

    // Faculty 2 login (Dr. Alice Johnson)
    const resFac2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice.johnson@university.edu', password: 'facultypassword' })
    });
    assert.strictEqual(resFac2.status, 200);
    const dataFac2 = await resFac2.json();
    faculty2Token = dataFac2.data.token;

    // Student 1 login
    const resStud1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@student.university.edu', password: 'studentpassword' })
    });
    assert.strictEqual(resStud1.status, 200);
    const dataStud1 = await resStud1.json();
    student1Token = dataStud1.data.token;

    // Student 2 login (not enrolled in CS301)
    const resStud2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student11@student.university.edu', password: 'studentpassword' })
    });
    assert.strictEqual(resStud2.status, 200);
    const dataStud2 = await resStud2.json();
    student2Token = dataStud2.data.token;
  });

  test('1.3 GET /auth/me returns matching profile information', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.user.role, 'STUDENT');
    assert.strictEqual(data.data.user.email, 'student1@student.university.edu');
  });

  // =========================================================================
  // 2. AUTHORIZATION & ROLE RESTRICTIONS
  // =========================================================================
  test('2.1 Student cannot access Admin or Faculty routes', async () => {
    const resAdmin = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(resAdmin.status, 403);

    const resFac = await fetch(`${BASE_URL}/faculty/summary`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(resFac.status, 403);
  });

  test('2.2 Faculty cannot access Admin routes', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${faculty1Token}` }
    });
    assert.strictEqual(res.status, 403);
  });

  test('2.3 Unauthenticated request is rejected', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    assert.strictEqual(res.status, 401);
  });

  // =========================================================================
  // 3. STUDENT PORTAL APIs & CONSTRAINTS
  // =========================================================================
  test('3.1 Retrieve enrolled courses and select target courses', async () => {
    const res = await fetch(`${BASE_URL}/student/courses`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data.courses));

    // Capture course IDs for subsequent test stages
    const cs301 = data.data.courses.find(c => c.courseCode === 'CS301');
    assert.ok(cs301, 'Student 1 must be enrolled in CS301');
    courseIdCS301 = cs301.courseId;

    const cs302 = data.data.courses.find(c => c.courseCode === 'CS302');
    assert.ok(cs302, 'Student 1 must be enrolled in CS302');
    courseIdCS302 = cs302.courseId;

    // Retrieve active questions
    const resQ = await fetch(`${BASE_URL}/student/questions`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(resQ.status, 200);
    const dataQ = await resQ.json();
    assert.ok(dataQ.data.length > 0);
    questionId = dataQ.data[0]._id;
  });

  test('3.2 Student cannot access feedback status for a course they are not enrolled in', async () => {
    // Student 2 (student 11) is not enrolled in CS301
    // Student 2 queries status for CS301 (which they are not enrolled in)
    const resUnauth = await fetch(`${BASE_URL}/student/feedback/status/${courseIdCS301}`, {
      headers: { 'Authorization': `Bearer ${student2Token}` }
    });
    // Should be blocked by our enrollment gate returning 403
    assert.strictEqual(resUnauth.status, 403);
  });

  // =========================================================================
  // 4. FACULTY PORTAL & ANONYMITY THRESHOLD
  // =========================================================================
  test('4.1 Faculty cannot access another faculty course analytics', async () => {
    // Faculty 2 (Dr. Alice Johnson) queries analytics for CS301 (Dr. John Smith's course)
    const res = await fetch(`${BASE_URL}/faculty/courses/${courseIdCS301}/analytics`, {
      headers: { 'Authorization': `Bearer ${faculty2Token}` }
    });
    // Should be rejected by course ownership verification check returning 403 or 404
    assert.ok(res.status === 403 || res.status === 404);
  });

  test('4.2 Faculty global metrics check and threshold enforcement', async () => {
    // Since there is only 1 submission (from our student evaluation in previous flows)
    // CS301 feedback count is 1 (< 3).
    // Let's query analytics for CS301 and verify comments are empty and distribution is zeroed
    const resAnalytics = await fetch(`${BASE_URL}/faculty/courses/${courseIdCS301}/analytics`, {
      headers: { 'Authorization': `Bearer ${faculty1Token}` }
    });
    assert.strictEqual(resAnalytics.status, 200);
    const data = await resAnalytics.json();
    
    // Comments list must be empty due to privacy threshold (< 3 responses)
    assert.strictEqual(data.data.comments.length, 0);
    
    // Distribution must be zeroed out
    data.data.ratingDistribution.forEach(d => {
      assert.strictEqual(d.count, 0);
    });
    
    // Overall rating average must be 0
    assert.strictEqual(data.data.overallAvgRating, 0);
  });

  test('4.3 Faculty cannot query distribution for another faculty course directly', async () => {
    const res = await fetch(`${BASE_URL}/faculty/analytics/distribution?courseId=${courseIdCS302}`, {
      headers: { 'Authorization': `Bearer ${faculty1Token}` }
    });
    assert.strictEqual(res.status, 403);
  });

  // =========================================================================
  // 5. ADMIN PORTAL APIs
  // =========================================================================
  test('5.1 Admin can read system metrics summary', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.students >= 20);
    assert.ok(data.data.faculty >= 5);
  });

  test('5.2 Admin can fetch student list', async () => {
    const res = await fetch(`${BASE_URL}/admin/students?limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.records.length > 0);
  });

  test('5.3 Admin can retrieve analytics filters', async () => {
    const res = await fetch(`${BASE_URL}/admin/analytics/filters`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.semesters.includes('Fall 2026'));
  });

  // =========================================================================
  // 6. VERIFICATION OF SECURITY FIXES
  // =========================================================================
  test('6.1 Student password hash is excluded from Admin student list response', async () => {
    const res = await fetch(`${BASE_URL}/admin/students?limit=2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.records.length > 0);
    data.data.records.forEach((record) => {
      assert.strictEqual(record.password, undefined, 'Student record must not contain password hash');
    });
  });

  test('6.2 Student feedback history endpoint retrieves cross-window submitted history', async () => {
    const res = await fetch(`${BASE_URL}/student/history`, {
      headers: { 'Authorization': `Bearer ${student1Token}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(Array.isArray(data.data.history));
    // Verify shaped fields (password, raw ratings, comments must not be returned)
    data.data.history.forEach((h) => {
      assert.strictEqual(h.ratings, undefined);
      assert.strictEqual(h.comment, undefined);
      assert.ok(h.course);
      assert.ok(h.course.courseCode);
    });
  });

  test('6.3 Auth logout endpoint is functional and returns 200 success', async () => {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${student1Token}`,
        'Content-Type': 'application/json' 
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Logout successful');
  });
});

