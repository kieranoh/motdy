// Firebase 초기화
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);

// Custom Claim: admin 권한은 Firebase 콘솔에서 사용자 관리 > 사용자 선택 > 사용자 클레임에
// { admin: true } 로 설정하거나, Cloud Functions로 설정해야 합니다.