// 이름 없는 이용 기록을 서버로 보낸다. 실패해도 관람 흐름에는 아무 영향이 없다.
// 보내는 것: 투어 id, 무작위 방문 번호, 이벤트 종류, 유물 번호. 아이의 대답은 보내지 않는다.

export function createEvents(tourId, getVisit) {
  return function track(type, code = null) {
    const visit = getVisit();
    if (!visit) return;
    try {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: tourId, visit, type, code }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // 기록을 못 보내도 괜찮다
    }
  };
}
