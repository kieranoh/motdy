// Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyCGroYj_1Mpw0GBUn0p37z4Nncl1chqLUc",
  authDomain: "motdy-2b3ea.firebaseapp.com",
  databaseURL: "https://motdy-2b3ea-default-rtdb.firebaseio.com/",
  projectId: "motdy-2b3ea",
  storageBucket: "motdy-2b3ea.firebasestorage.app",
  messagingSenderId: "376404804075",
  appId: "1:376404804075:web:d4d85f0baab14fe3a859ae",
  measurementId: "G-F2W9Y511E6"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rdb = firebase.database();

// DOM 요소 참조
const btnLogin = document.getElementById('btn-google-login');
const btnLogout = document.getElementById('btn-logout');
const btnBook = document.getElementById('btn-book-now');
const btnDelete = document.getElementById('btn-delete-now');
const userInfo = document.getElementById('user-info');
const overlay = document.getElementById('bookingOverlay');
const bookingForm = document.getElementById('bookingForm');
const deleteOverlay = document.getElementById('deleteOverlay');
const deleteForm = document.getElementById('deleteForm');
const btnCancel = document.getElementById('btn-cancel');
const btnDeleteCancel = document.getElementById('btn-delete-cancel');

// 유틸: 시간 문자열을 분으로 변환
function toMins(t) {
  const [h,m] = t.split(':').map(Number);
  return h * 60 + m;
}
// 시간 옵션
function populateTimeOptions(id) {
  const sel = document.getElementById(id);
  sel.innerHTML = '';
  for (let h = 8; h <= 23; h++) {
    for (let m of [0,30]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      const opt = document.createElement('option');
      opt.value = `${hh}:${mm}`;
      opt.textContent = `${hh}:${mm}`;
      sel.appendChild(opt);
    }
  }
}

// 초기 설정
document.addEventListener('DOMContentLoaded', () => {
  populateTimeOptions('form-start');
  populateTimeOptions('form-end');
  document.getElementById('form-date').value = new Date().toISOString().slice(0,10);

  // 예약 유형 변경 시 입력 필드 토글
  document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('label-team').style.display =
        radio.value === '합주' ? 'block' : 'none';
      document.getElementById('label-name').style.display =
        radio.value === '개인연습' ? 'block' : 'none';
    });
  });
});


// 스케줄 렌더링
async function renderSchedule() {
  const tbody = document.querySelector('#weekly-schedule tbody');
  tbody.innerHTML = '';

  // 예약 데이터 로드
  const snap = await rdb.ref('bookings').once('value');
  const bookingMap = {};
  snap.forEach(ch => {
    const b = ch.val();
    let cur = toMins(b.start);
    const endMin = toMins(b.end);
    while (cur < endMin) {
      const hh = String(Math.floor(cur/60)).padStart(2,'0');
      const mm = String(cur%60).padStart(2,'0');
      bookingMap[`${b.date}_${hh}:${mm}`] = b;
      cur += 30;
    }
  });

  // 헤더 날짜 갱신
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - (day===0?6:day-1));
  const headings = document.querySelectorAll('#weekly-schedule thead th[data-day]');
  headings.forEach(th => {
    const i = Number(th.dataset.day);
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const dateStr = d.toISOString().slice(0,10);
    th.innerHTML = `${th.textContent.split('<')[0]}<br>${dateStr}`;
  });

  // 바디 그리드
  for (let h = 8; h <= 23; h++) {
    for (let m of [0,30]) {
      const tr = document.createElement('tr');
      const label = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      tr.innerHTML = `<th>${label}</th>`;
      for (let i=0; i<7; i++) {
        const d = new Date(mon);
        d.setDate(mon.getDate()+i);
        const key = `${d.toISOString().slice(0,10)}_${label}`;
        const b = bookingMap[key];
        tr.innerHTML += `<td>${b? (b.type==='합주'?b.team:b.name):''}</td>`;
      }
      tbody.appendChild(tr);
    }
  }
}

// 시간 선택 옵션
function populateTimeOptions(id) {
  const sel = document.getElementById(id);
  sel.innerHTML = '';
  for (let h=8; h<=23; h++) {
    for (let m of [0,30]) {
      const hh = String(h).padStart(2,'0');
      const mm = String(m).padStart(2,'0');
      const opt = document.createElement('option');
      opt.value = `${hh}:${mm}`;
      opt.textContent = `${hh}:${mm}`;
      sel.appendChild(opt);
    }
  }
}

// 예약 모달 열기/닫기
btnBook.addEventListener('click', () => {
  overlay.style.display = 'block';
  bookingForm.style.display = 'block';
});
btnCancel.addEventListener('click', () => {
  bookingForm.style.display = 'none'; overlay.style.display = 'none';
});
overlay.addEventListener('click', () => btnCancel.click());

// 삭제 모달 열기/닫기 및 리스트
async function showDeleteModal() {
  deleteOverlay.style.display = 'block';
  deleteForm.style.display = 'block';
  const list = document.getElementById('delete-list');
  list.innerHTML = '';
  const user = auth.currentUser;
  if (!user) { list.innerHTML = '<li>로그인이 필요합니다.</li>'; return; }
  const snap = await rdb.ref('bookings').once('value');
  let any = false;
  snap.forEach(ch => {
    const b = ch.val();
    if (b.user === user.uid) {
      any = true;
      const li = document.createElement('li');
      li.textContent = `${b.date} ${b.start}-${b.end} (${b.type==='합주'?b.team:b.name}) `;
      const btn = document.createElement('button');
      btn.textContent = '삭제';
      btn.addEventListener('click', async () => {
        await rdb.ref('bookings/'+ch.key).remove();
        li.remove(); alert('삭제되었습니다.'); renderSchedule();
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
  });
  if (!any) list.innerHTML = '<li>예약 내역이 없습니다.</li>';
}
btnDelete.addEventListener('click', showDeleteModal);
btnDeleteCancel.addEventListener('click', () => {
  deleteForm.style.display = 'none'; deleteOverlay.style.display = 'none';
});
deleteOverlay.addEventListener('click', () => btnDeleteCancel.click());

// 인증/로그인 처리
btnLogin.addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
btnLogout.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    userInfo.textContent = `환영합니다, ${user.displayName}`;
    btnLogin.style.display = 'none'; btnLogout.style.display = '';
    btnBook.style.display = '';
    btnDelete.style.display = '';
    renderSchedule();
  } else {
    userInfo.textContent = '';
    btnLogin.style.display = '';
    btnLogout.style.display = 'none';
    btnBook.style.display = 'none';
    btnDelete.style.display = 'none';
    document.querySelector('#weekly-schedule tbody').innerHTML = '';
  }
});

// 예약 저장
const formBooking = document.getElementById('formBooking');
formBooking.addEventListener('submit', async e => {
  e.preventDefault();
  const type = document.querySelector('input[name="type"]:checked').value;
  const date = document.getElementById('form-date').value;
  const start = document.getElementById('form-start').value;
  const end = document.getElementById('form-end').value;
  // 충돌 검사
  const sMin = toMins(start), eMin = toMins(end);
  const snap = await rdb.ref('bookings').orderByChild('date').equalTo(date).once('value');
  let conflict = false;
  snap.forEach(ch => {
    const b = ch.val();
    const bs = toMins(b.start), be = toMins(b.end);
    if (sMin < be && eMin > bs) conflict = true;
  });
  if (conflict) { alert('이미 예약된 시간대가 있습니다.'); return; }
  // 유효성
  const today = new Date().toISOString().slice(0,10);
  if (type==='개인연습' && date !== today) { alert('개인연습은 당일만 예약 가능합니다.'); return; }
  const dur = eMin - sMin;
  if (dur < 30) { alert('최소 30분 이상 예약해야 합니다.'); return; }
  if (dur > 60) { alert('최대 60분까지 예약 가능합니다.'); return; }
  // 저장
  const data = { type, date, start, end, user: auth.currentUser.uid };
  if (type==='합주') data.team = document.getElementById('form-team').value;
  else data.name = document.getElementById('form-name').value;
  await rdb.ref('bookings').push(data);
  alert('예약이 완료되었습니다.');
  btnCancel.click();
  renderSchedule();
});