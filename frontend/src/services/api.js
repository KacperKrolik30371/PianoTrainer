const API_BASE_URL = "http://localhost:3000/api";

const getToken = () => localStorage.getItem("token");

const request = async (path, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Blad komunikacji z API");
  }

  return data;
};

export const getProfile = () => request("/profile");

export const getNoteRecognitionProgress = () =>
  request("/progress/note-recognition");

export const saveNoteRecognitionProgress = (payload) =>
  request("/progress/note-recognition", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getRhythmProgress = () => request("/progress/rhythm");

export const saveRhythmProgress = (payload) =>
  request("/progress/rhythm", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getSettings = () => request("/progress/settings");

export const saveSettings = (payload) =>
  request("/progress/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
