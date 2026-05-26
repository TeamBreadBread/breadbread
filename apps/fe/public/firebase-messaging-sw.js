/* eslint-disable no-undef */
/**
 * FCM 백그라운드 알림 처리 스크립트.
 * 프로덕션에서는 Vite PWA가 생성한 `sw.js`가 이 파일을 importScripts 로 불러 실행합니다.
 * 개발 환경에서는 이 파일을 직접 Service Worker 로 등록해 로컬 FCM 테스트를 유지합니다.
 * 설정은 `src/lib/firebase/config.ts` 기본값과 동일하게 유지합니다.
 */
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDgJfGsiQVxZBA9WZ1nvFGEZrIzyqSRgoQ",
  authDomain: "breadbread-494200.firebaseapp.com",
  projectId: "breadbread-494200",
  storageBucket: "breadbread-494200.firebasestorage.app",
  messagingSenderId: "317081501838",
  appId: "1:317081501838:web:10f2995f323dce7b1949df",
  measurementId: "G-GZCY2K48HQ",
});

const messaging = firebase.messaging();

function pathFromData(data) {
  if (!data) return "/home";
  if (data.type === "AI_COURSE" && data.courseId) {
    return "/ai-search-result?courseId=" + encodeURIComponent(String(data.courseId));
  }
  if (data.type === "PAYMENT" && data.reservationId) {
    return "/my-reservation-detail?id=" + encodeURIComponent(String(data.reservationId));
  }
  return "/home";
}

messaging.onBackgroundMessage(function (payload) {
  const title = (payload.notification && payload.notification.title) || "BreadBread";
  const body = (payload.notification && payload.notification.body) || "";
  const data = payload.data || {};

  return self.registration.showNotification(title, {
    body: body,
    icon: "/favicon.svg",
    data: data,
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  const targetPath = pathFromData(data);
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(function () {
              return client.focus();
            });
          }
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
