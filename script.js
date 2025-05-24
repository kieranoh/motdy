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
    const auth = firebase.auth(), rdb = firebase.database();
    let isAdmin = false; 
    let datePicker;

    function getThisWeekMonday8() {
  const now = new Date();
  const day = now.getDay();  // 일=0, 월=1…
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(8,0,0,0);
  return mon;
}
function getNextWeekMonday8() {
  const mon8 = getThisWeekMonday8();
  const sun = new Date(mon8);
  sun.setDate(mon8.getDate() + 6);   // 월 + 6일 = 일
  sun.setHours(23,59,59,999);
  return sun;
}

    // 스케줄 렌더링
    
    async function renderSchedule() {
      const today = new Date(), day = today.getDay(), mon = new Date(today);
      mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      const weekdays = ["월","화","수","목","금","토","일"];
      for (let i=0; i<7; i++) {
        const cell = document.querySelector(`#weekly-schedule thead th[data-day='${i}']`);
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        cell.innerHTML = `${weekdays[i]}<br>${d.toISOString().slice(0,10)}`;
      }
      const tbody = document.querySelector('#weekly-schedule tbody');
      tbody.innerHTML = '';
      const snap = await rdb.ref('bookings').once('value'), bookingMap = {};
      snap.forEach(ch => {
        const b = ch.val(), keyBase = b.date + "_";
        let cur = b.start.split(':').reduce((h,m)=>h*60+parseInt(m),0);
        const endMin = b.end.split(':').reduce((h,m)=>h*60+parseInt(m),0);
        while (cur < endMin) {
          const hh = String(Math.floor(cur/60)).padStart(2,'0'),
                mm = String(cur%60).padStart(2,'0');
          bookingMap[keyBase + hh+':'+mm] = b;
          cur += 30;
        }
      });
      for (let h=8; h<=23; h++) {
        for (let m of [0,30]) {
          const tr = document.createElement('tr'), label = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
          tr.innerHTML = `<th>${label}</th>`;
          for (let i=0; i<7; i++) {
            const d = new Date(mon); d.setDate(mon.getDate()+i);
            const key = `${d.toISOString().slice(0,10)}_${label}`,
                  b = bookingMap[key];
            tr.innerHTML += `<td>${b? (b.type==='합주'?b.team:b.name):''}</td>`;
          }
          tbody.appendChild(tr);
        }
      }
    }

    // 시간 옵션 채우기
    function populateTimeOptions(id) {
      const sel = document.getElementById(id);
      sel.innerHTML = '';
      for (let h=8; h<=23; h++) {
        for (let m of [0,30]) {
          const hh = String(h).padStart(2,'0'),
                mm = String(m).padStart(2,'0'),
                opt = document.createElement('option');
          opt.value = `${hh}:${mm}`;
          opt.textContent = `${hh}:${mm}`;
          sel.appendChild(opt);
        }
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      populateTimeOptions('form-start');
      populateTimeOptions('form-end');
      document.getElementById('form-date').value = new Date().toISOString().slice(0,10);

      renderSchedule();

      const dateInput = document.getElementById('form-date');
    const mon8 = getThisWeekMonday8();
    const nextMon8 = getNextWeekMonday8();
    const toYMD = d => d.toISOString().slice(0,10);

    datePicker =  flatpickr("#form-date", {
    locale: "ko",              // 한글 로케일
    dateFormat: "Y-m-d",
    defaultDate: new Date(),    // 오늘
    minDate: mon8,              // 이번 주 월요일
    maxDate: new Date(nextMon8.getTime()), // 다음 주 월요일 직전
    weekNumbers: false,
    firstDayOfWeek: 1,           // 월요일을 주 시작으로
    clickOpens: false 
  });
  document.getElementById('btn-date-trigger')
  .addEventListener('click', () => datePicker.open());

      // 타입별 라벨 토글
      const labelTeam = document.getElementById('label-team');
      const labelName = document.getElementById('label-name');
      const initType = document.querySelector('input[name="type"]:checked').value;
      if (initType === '개인연습') {
        labelTeam.style.display = 'none';
        labelName.style.display = 'block';
      }
      document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.value === '개인연습') {
            labelTeam.style.display = 'none';
            labelName.style.display = 'block';
          } else {
            labelTeam.style.display = 'block';
            labelName.style.display = 'none';
          }
        });
      });
    });

    // 인증 상태에 따라 UI 전환
    const btnLogin = document.getElementById('btn-google-login'),
          btnLogout = document.getElementById('btn-logout'),
          btnBook = document.getElementById('btn-book-now'),
          btnDelete = document.getElementById('btn-delete-now'),
          greeting = document.getElementById('greeting');

    btnLogin.onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    btnLogout.onclick = () => auth.signOut();

    auth.onAuthStateChanged(async user => {
  isAdmin = false;
  if (user) {
    // 인사말, 버튼 토글(로그인/로그아웃/예약/삭제 버튼 보이기)
    greeting.textContent = `안녕하세요, ${user.displayName}님`;
    greeting.style.display = 'inline';
    btnLogin.style.display  = 'none';
    btnLogout.style.display = 'inline';
    btnBook.style.display   = 'inline';
    btnDelete.style.display = 'inline';

    // 관리자 여부 확인 (/admins/{uid} 경로)
    const snap = await rdb.ref('admins/' + user.uid).once('value');
    if (snap.val() === true) {
      isAdmin = true;
      // 관리자 전용 UI 추가 변경이 필요하면 여기서!
    }
  } else {
    // 비로그인 상태
    greeting.style.display  = 'none';
    btnLogin.style.display  = 'inline';
    btnLogout.style.display = 'none';
    btnBook.style.display   = 'none';
    btnDelete.style.display = 'none';
  }
  if (isAdmin) {
    datePicker.set('minDate', null);
    datePicker.set('maxDate', null);
  } else {
    datePicker.set('minDate', getThisWeekMonday8());
    datePicker.set('maxDate', getNextWeekMonday8());
  }

  // 로그인 유무 상관없이 스케줄 렌더
  renderSchedule();
});

    // 모달 열기/닫기 & 삭제 로직
    const overlay = document.getElementById('bookingOverlay'),
          formDiv = document.getElementById('bookingForm'),
          deleteOverlay = document.getElementById('deleteOverlay'),
          deleteForm = document.getElementById('deleteForm'),
          btnCancel = document.getElementById('btn-cancel'),
          btnDeleteCancel = document.getElementById('btn-delete-cancel');

    btnBook.onclick = () => {
  overlay.style.display = 'block';
  formDiv.style.display   = 'block';

  // 항상 팀명/이름 토글만 처리
  const labelTeam = document.getElementById('label-team');
  const labelName = document.getElementById('label-name');
  const checked  = document.querySelector('input[name="type"]:checked').value;

  if (checked === '합주') {
    labelTeam.style.display = 'block';
    labelName.style.display = 'none';
  } else {
    labelTeam.style.display = 'none';
    labelName.style.display = 'block';
  }
};
    btnCancel.onclick = () => { formDiv.style.display = 'none'; overlay.style.display = 'none'; };
    overlay.onclick = () => btnCancel.onclick();

    btnDelete.onclick = async () => {
  deleteOverlay.style.display = 'block';
  deleteForm.style.display = 'block';
  const list = document.getElementById('delete-list');
  list.innerHTML = '';
  const user = auth.currentUser;
  if (!user) return;

  const snap = await rdb.ref('bookings').once('value');
  let found = false;
  snap.forEach(ch => {
    const b = ch.val();
    // 관리자면 무조건, 일반 유저면 본인 것만
    if (isAdmin || b.user === user.uid) {
      found = true;
      const li = document.createElement('li');
      li.textContent = `${b.date} ${b.start}-${b.end} (${b.type==='합주'?b.team:b.name}) `;
      const btn = document.createElement('button');
      btn.textContent = '삭제';
      btn.onclick = async () => {
        await rdb.ref('bookings/'+ch.key).remove();
        alert('삭제되었습니다.');
        li.remove();
        renderSchedule();
      };
      li.appendChild(btn);
      list.appendChild(li);
    }
  });
  if (!found) {
    list.innerHTML = isAdmin
      ? '<li>예약 내역이 없습니다.</li>'
      : '<li>예약 내역이 없습니다.</li>';  // 일반 유저 메시지와 동일
  }
};

    btnDeleteCancel.onclick = () => { deleteForm.style.display = 'none'; deleteOverlay.style.display = 'none'; };
    deleteOverlay.onclick = () => btnDeleteCancel.onclick();

    // 예약 저장
    document.getElementById('formBooking').onsubmit = async e => {
      e.preventDefault();
      
      const type = document.querySelector('input[name="type"]:checked').value;
      const date = document.getElementById('form-date').value,
            start = document.getElementById('form-start').value,
             end = document.getElementById('form-end').value;
       const team = document.getElementById('form-team').value.trim();
    const name = document.getElementById('form-name').value.trim();


      if (type === '합주') {
    if (!team) {
      alert('팀명을 입력해주세요.');
      return;
    }
  } else if (type === '개인연습') {
    if (!name) {
      alert('이름을 입력해주세요.');
      return;
    }
  }
            if(!isAdmin){

              const selDateStr = document.getElementById('form-date').value;           // "2025-05-26"
              const selDate = new Date(selDateStr + 'T00:00:00');                     // 자정 기준
              const mon8     = getThisWeekMonday8();                                  // 이번 주 월 08:00
              const nextMon8 = getNextWeekMonday8();                                  // 다음 주 월 08:00
              const now      = new Date();
              

   if (now < mon8) {
    alert('이번 주 예약은 매주 월요일 오전 8시 이후에만 가능합니다.');
    return;
  }
  if (selDate < new Date(mon8.getFullYear(),mon8.getMonth(),mon8.getDate())
      || selDate >  new Date(nextMon8.getFullYear(),nextMon8.getMonth(),nextMon8.getDate())) {
    alert('예약 가능한 날짜는 이번 주 월요일부터 일요일까지입니다.');
    return;
  }
              const toMins = t => t.split(':').reduce((h,m)=>h*60+parseInt(m),0),
            sMin = toMins(start), eMin = toMins(end);
      const snap = await rdb.ref('bookings').orderByChild('date').equalTo(date).once('value');
      let conflict = false;
      snap.forEach(ch => {
        const b = ch.val(),
              bs = toMins(b.start), be = toMins(b.end);
        if (sMin < be && eMin > bs) conflict = true;
      });
      if (conflict) { alert('이미 예약된 시간대가 있습니다.'); return; }
      if (type==='개인연습' && date !== new Date().toISOString().slice(0,10)) {
        return alert('개인연습은 당일만 예약 가능합니다.');
      }
      const dur = eMin - sMin;
      if (dur < 30) return alert('최소 30분 이상 예약해야 합니다.');
      if (dur > 60) return alert('최대 60분까지 예약 가능합니다.');        
      }
      

      const data = { type,date,start,end,user:auth.currentUser.uid };
      if (type==='합주') data.team = document.getElementById('form-team').value;
      else data.name = document.getElementById('form-name').value;
      

      await rdb.ref('bookings').push(data);
      alert('예약이 완료되었습니다.');
      btnCancel.onclick();
      renderSchedule();
    };