// Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyCGroYj_1Mpw0GBUn0p37z4Nncl1chqLUc",
  authDomain: "motdy-2b3ea.firebaseapp.com",
  projectId: "motdy-2b3ea",
  storageBucket: "motdy-2b3ea.firebasestorage.app",
  messagingSenderId: "376404804075",
  appId: "1:376404804075:web:d4d85f0baab14fe3a859ae",
  measurementId: "G-F2W9Y511E6"
};
firebase.initializeApp(firebaseConfig);

// Custom Claim: admin 권한은 Firebase 콘솔에서 사용자 관리 > 사용자 선택 > 사용자 클레임에
// { admin: true } 로 설정하거나, Cloud Functions로 설정해야 합니다.