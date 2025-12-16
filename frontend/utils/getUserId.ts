export function getUserId() {
  let uid = localStorage.getItem("motia_user_id");
  if (!uid) {
    uid = "user_" + crypto.randomUUID();
    localStorage.setItem("motia_user_id", uid);
  }
  return uid;
}
