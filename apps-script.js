// ============================================================
//  THE PERI PERI SHACK — STAFF TRAINING PORTAL
//  Google Apps Script Backend v2 (Multi-Location)
// ============================================================

const ADMIN_PIN      = '6969';  // Owner master PIN — change this
const PASS_THRESHOLD = 85;      // Quiz pass mark (%)

// ── ROUTER ───────────────────────────────────────────────────
function doGet(e) {
  const p = e.parameter;
  const out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  let result;
  try {
    switch (p.action) {
      case 'login':            result = login(p.pin);                                               break;
      case 'supervisorLogin':  result = supervisorLogin(p.password);                                break;
      case 'getVideos':        result = getVideos(p.pin);                                           break;
      case 'markWatched':      result = markWatched(p.pin, p.videoId);                              break;
      case 'getQuiz':          result = getQuiz(p.videoId);                                         break;
      case 'submitQuiz':       result = submitQuiz(p.pin, p.videoId, parseFloat(p.score));          break;
      case 'getLocations':     result = getLocations(p.pin);                                        break;
      case 'adminReport':      result = adminReport(p.pin, p.locationId);                           break;
      case 'supervisorReport': result = supervisorReport(p.password);                               break;
      case 'addEmployee':      result = addEmployee(p.token, p.pin, p.name, p.role, p.locationId); break;
      case 'resetProgress':    result = resetProgress(p.token, p.pin, p.videoId);                  break;
      case 'setup':            result = setupSheets();                                              break;
      default:                 result = { error: 'Unknown action: ' + p.action };
    }
  } catch (err) {
    result = { error: 'Server error: ' + err.toString() };
  }
  out.setContent(JSON.stringify(result));
  return out;
}

// ── HELPERS ───────────────────────────────────────────────────
function sheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Sheet "' + name + '" not found. Run setupSheets() first.');
  return s;
}

function padPin(pin) { return String(pin).padStart(4, '0'); }

function isAdmin(token) { return String(token) === String(ADMIN_PIN); }

function getSupervisor(password) {
  if (!password) return null;
  const rows = sheet('Supervisors').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && String(rows[i][0]) === String(password)) {
      return { password: rows[i][0], name: rows[i][1], locationId: String(rows[i][2]) };
    }
  }
  return null;
}

function getLocationName(locationId) {
  const rows = sheet('Locations').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(locationId)) return rows[i][1];
  }
  return 'Unknown Location';
}

// ── LOGIN ─────────────────────────────────────────────────────
function login(pin) {
  if (!pin) return { error: 'Please enter your PIN.' };
  if (isAdmin(pin)) {
    return { success: true, employee: { name: 'Owner', role: 'Admin', isAdmin: true } };
  }
  const rows = sheet('Employees').getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] !== '' && padPin(rows[i][0]) === padPin(pin)) {
      return { success: true, employee: { pin: padPin(rows[i][0]), name: rows[i][1], role: rows[i][2], locationId: String(rows[i][3]) } };
    }
  }
  return { error: 'PIN not recognised. Please check with your manager.' };
}

function supervisorLogin(password) {
  if (!password) return { error: 'Please enter your supervisor password.' };
  const sup = getSupervisor(password);
  if (!sup) return { error: 'Incorrect password. Please try again.' };
  return { success: true, supervisor: { name: sup.name, locationId: sup.locationId, locationName: getLocationName(sup.locationId) } };
}

// ── STAFF TRAINING ────────────────────────────────────────────
function getVideos(pin) {
  const vData = sheet('Videos').getDataRange().getValues();
  const pData = sheet('Progress').getDataRange().getValues();

  const prog = {};
  for (let i = 1; i < pData.length; i++) {
    if (padPin(pData[i][0]) === padPin(pin)) {
      prog[String(pData[i][1])] = { watched: pData[i][2], quizScore: pData[i][3], quizPassed: pData[i][4] };
    }
  }

  const videos = [];
  for (let i = 1; i < vData.length; i++) {
    if (!vData[i][0]) continue;
    const id = String(vData[i][0]), p = prog[id] || {};
    videos.push({
      id, title: vData[i][1], youtubeUrl: vData[i][2], description: vData[i][3], order: vData[i][4] || i,
      watched: !!p.watched, quizScore: p.quizScore != null ? p.quizScore : null,
      quizPassed: !!p.quizPassed, completed: !!p.watched && !!p.quizPassed
    });
  }
  videos.sort((a, b) => (a.order || 0) - (b.order || 0));
  return { success: true, videos };
}

function markWatched(pin, videoId) {
  if (!pin || !videoId) return { error: 'Missing pin or videoId' };
  const s = sheet('Progress'), rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (padPin(rows[i][0]) === padPin(pin) && String(rows[i][1]) === String(videoId)) {
      s.getRange(i + 1, 3).setValue(true);
      s.getRange(i + 1, 6).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  s.appendRow([pin, videoId, true, '', false, new Date().toISOString()]);
  return { success: true };
}

function getQuiz(videoId) {
  if (!videoId) return { error: 'Missing videoId' };
  const rows = sheet('Quizzes').getDataRange().getValues();
  const questions = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(videoId) && rows[i][1]) {
      questions.push({
        question: rows[i][1],
        options: { A: rows[i][2] || null, B: rows[i][3] || null, C: rows[i][4] || null, D: rows[i][5] || null },
        correct: String(rows[i][6]).trim().toUpperCase()
      });
    }
  }
  if (!questions.length) return { error: 'No quiz found for this video.' };
  return { success: true, questions };
}

function submitQuiz(pin, videoId, score) {
  if (!pin || !videoId || isNaN(score)) return { error: 'Invalid submission.' };
  const passed = score >= PASS_THRESHOLD;
  const s = sheet('Progress'), rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (padPin(rows[i][0]) === padPin(pin) && String(rows[i][1]) === String(videoId)) {
      const existing = parseFloat(rows[i][3]);
      if (isNaN(existing) || score > existing) {
        s.getRange(i + 1, 4).setValue(score);
        s.getRange(i + 1, 5).setValue(passed);
        s.getRange(i + 1, 6).setValue(new Date().toISOString());
      }
      return { success: true, score, passed, threshold: PASS_THRESHOLD };
    }
  }
  s.appendRow([pin, videoId, true, score, passed, new Date().toISOString()]);
  return { success: true, score, passed, threshold: PASS_THRESHOLD };
}

// ── ADMIN & SUPERVISOR REPORTS ────────────────────────────────
function buildReportData(locationId) {
  const videos = sheet('Videos').getDataRange().getValues().slice(1)
    .filter(r => r[0]).map(r => ({ id: String(r[0]), title: r[1] }));

  const allEmp = sheet('Employees').getDataRange().getValues().slice(1).filter(r => r[0]);
  const employees = (locationId
    ? allEmp.filter(r => String(r[3]) === String(locationId))
    : allEmp
  ).map(r => ({ pin: padPin(r[0]), name: r[1], role: r[2], locationId: String(r[3]) }));

  const progressMap = {};
  sheet('Progress').getDataRange().getValues().slice(1).forEach(r => {
    if (!r[0]) return;
    progressMap[padPin(r[0]) + '_' + String(r[1])] = {
      watched: r[2], score: (r[3] !== '' && r[3] != null) ? r[3] : null, passed: r[4], date: r[5]
    };
  });

  return { employees, videos, progressMap };
}

function getLocations(pin) {
  if (!isAdmin(pin)) return { error: 'Unauthorised.' };
  const locations = sheet('Locations').getDataRange().getValues().slice(1)
    .filter(r => r[0]).map(r => ({ id: String(r[0]), name: r[1] }));
  return { success: true, locations };
}

function adminReport(pin, locationId) {
  if (!isAdmin(pin)) return { error: 'Unauthorised.' };
  const locations = sheet('Locations').getDataRange().getValues().slice(1)
    .filter(r => r[0]).map(r => ({ id: String(r[0]), name: r[1] }));
  const data = buildReportData(locationId || null);
  return { success: true, ...data, locations };
}

function supervisorReport(password) {
  const sup = getSupervisor(password);
  if (!sup) return { error: 'Unauthorised.' };
  const data = buildReportData(sup.locationId);
  return { success: true, ...data, locationId: sup.locationId, locationName: getLocationName(sup.locationId) };
}

// ── ADD EMPLOYEE ──────────────────────────────────────────────
function addEmployee(token, newPin, name, role, locationId) {
  let targetLocation = locationId;

  if (isAdmin(token)) {
    if (!locationId) return { error: 'Please select a location for this employee.' };
  } else {
    const sup = getSupervisor(token);
    if (!sup) return { error: 'Unauthorised.' };
    targetLocation = sup.locationId;
  }

  if (!newPin || !name || !role)    return { error: 'Name, role and PIN are all required.' };
  if (!/^\d{4}$/.test(String(newPin))) return { error: 'PIN must be exactly 4 digits.' };

  const s = sheet('Employees'), rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (padPin(rows[i][0]) === padPin(newPin))
      return { error: 'A staff member with PIN ' + newPin + ' already exists.' };
  }
  s.appendRow([newPin, name, role, targetLocation, new Date().toISOString()]);
  return { success: true };
}

// ── RESET PROGRESS ────────────────────────────────────────────
function resetProgress(token, pin, videoId) {
  let authorised = false;
  if (isAdmin(token)) {
    authorised = true;
  } else {
    const sup = getSupervisor(token);
    if (sup) {
      const empRows = sheet('Employees').getDataRange().getValues();
      for (let i = 1; i < empRows.length; i++) {
        if (padPin(empRows[i][0]) === padPin(pin) && String(empRows[i][3]) === String(sup.locationId)) {
          authorised = true; break;
        }
      }
    }
  }
  if (!authorised) return { error: 'Unauthorised.' };

  const s = sheet('Progress'), rows = s.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (padPin(rows[i][0]) === padPin(pin) && String(rows[i][1]) === String(videoId)) {
      s.getRange(i + 1, 3).setValue(false);
      s.getRange(i + 1, 4).setValue('');
      s.getRange(i + 1, 5).setValue(false);
      s.getRange(i + 1, 6).setValue(new Date().toISOString());
      return { success: true };
    }
  }
  return { success: true };
}

// ── SETUP (run once) ──────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = {
    'Locations':   ['LocationID',  'LocationName'],
    'Supervisors': ['Password',    'Name',      'LocationID'],
    'Employees':   ['PIN',         'Name',      'Role',    'LocationID', 'DateAdded'],
    'Videos':      ['VideoID',     'Title',     'YouTubeURL', 'Description', 'Order'],
    'Quizzes':     ['VideoID',     'Question',  'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Correct'],
    'Progress':    ['PIN',         'VideoID',   'Watched', 'QuizScore', 'QuizPassed', 'LastUpdated']
  };

  for (const [name, headers] of Object.entries(defs)) {
    let s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    const r = s.getRange(1, 1, 1, headers.length);
    r.setValues([headers]);
    r.setFontWeight('bold');
    r.setBackground('#8B1A1A');
    r.setFontColor('white');
    s.setFrozenRows(1);
    s.setColumnWidth(1, 130);
    s.setColumnWidth(2, 200);
  }

  // Example data
  const loc = ss.getSheetByName('Locations');
  if (loc.getLastRow() === 1) {
    loc.appendRow(['LOC001', 'Downtown']);
    loc.appendRow(['LOC002', 'Westside']);
  }
  const sup = ss.getSheetByName('Supervisors');
  if (sup.getLastRow() === 1) {
    sup.appendRow(['supervisor1', 'Downtown Supervisor', 'LOC001']);
    sup.appendRow(['supervisor2', 'Westside Supervisor', 'LOC002']);
  }
  const emp = ss.getSheetByName('Employees');
  if (emp.getLastRow() === 1) {
    emp.appendRow(['1234', 'Example Staff', 'Kitchen', 'LOC001', new Date().toISOString()]);
  }
  const vid = ss.getSheetByName('Videos');
  if (vid.getLastRow() === 1) {
    vid.appendRow(['VID001', 'Food Safety & Hygiene', 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID', 'Learn our food safety standards.', 1]);
  }
  const quiz = ss.getSheetByName('Quizzes');
  if (quiz.getLastRow() === 1) {
    quiz.appendRow(['VID001', 'How often should you wash your hands?', 'Once per hour', 'Before and after handling food', 'Only at start of shift', 'When visibly dirty', 'B']);
  }

  return { success: true, message: 'All sheets created!' };
}
