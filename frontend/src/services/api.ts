const API_URL = "http://localhost:8000";
console.log("API_URL =", API_URL);

export const apiFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: "include",   
  });
};

export const classifyImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Prediction failed");
  }

  return res.json();
};
