const $ = (s) => document.querySelector(s);

const form = $("#form");
const out = $("#out");
const nameEl = $("#name");
const rutEl = $("#rut");
const birthEl = $("#birthdate");
const phoneEl = $("#phone");
const emailEl = $("#email");
const phoneRegex = /^(\+?56)?\s*0?9\d{8}$/;

function setError(field, msg) {
  const errBox = document.getElementById(`err-${field}`);
  const input  = document.getElementById(field);
  if (errBox) errBox.textContent = msg || "";
  if (!input) return;

  if (msg) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
  } else {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }
}

function validate() {
  let valid = true;

  if (!nameEl.value.trim()) {
    setError("name", "Ingresa tu nombre.");
    valid = false;
  } else {
    setError("name", "");
  }

  const rutVal = rutEl.value.trim();
  if (!rutVal) {
    setError("rut", "Ingresa tu RUT.");
    valid = false;
  } else if (!isValidRut(rutVal)) {
    setError("rut", "RUT inválido. Revisa el dígito verificador.");
    valid = false;
  } else {
    setError("rut", "");
  }

  if (!birthEl.value) {
    setError("birthdate", "Selecciona tu fecha de nacimiento.");
    valid = false;
  } else {
    setError("birthdate", "");
  }

  const phoneVal = phoneEl.value.trim();
  if (!phoneVal) {
    setError("phone", "Ingresa tu teléfono.");
    valid = false;
  } else if (!phoneRegex.test(phoneVal)) {
    setError("phone", "Teléfono inválido. Revisa el formato: +56 9 XXXXXXXX.");
    valid = false;
  } else {
    setError("phone", "");
  }

  if (!emailEl.value.trim()) {
    setError("email", "Ingresa tu email.");
    valid = false;
  } else if (!emailEl.checkValidity()) {
    setError("email", "Email inválido.");
    valid = false;
  } else {
    setError("email", "");
  }

  return valid;
}

function focusFirstInvalid() {
  const first = document.querySelector(".is-invalid");
  if (first) {
    first.focus({ preventScroll: true });
    first.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

(function setTodayMax() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  birthEl.max = `${yyyy}-${mm}-${dd}`;
})();


rutEl.addEventListener("input", () => {
  const oldVal = rutEl.value;
  const oldPos = rutEl.selectionStart || 0;
  const idx = alnumCountUpTo(oldVal, oldPos);

  const clean = cleanRutInput(oldVal);
  const next = formatRutFromClean(clean);
  rutEl.value = next;

  const newPos = caretFromAlnumIndex(next, idx);
  rutEl.setSelectionRange(newPos, newPos);

  if (next) setError("rut", "");
});

nameEl.addEventListener("input", () => {
  const valid = nameEl.value.trim();
  if (!valid) setError("name", "Ingresa tu nombre.");
  else setError("name", "");
});

rutEl.addEventListener("blur", () => {
  const valid = rutEl.value.trim();
  if (!valid) {
    setError("rut", "Ingresa tu RUT.");
  } else if (!isValidRut(valid)) {
    setError("rut", "RUT inválido. Revisa el dígito verificador.");
  } else {
    setError("rut", "");
  }
});

birthEl.addEventListener("change", () => {
  if (!birthEl.value) setError("birthdate", "Selecciona tu fecha de nacimiento.");
  else setError("birthdate", "");
});

phoneEl.addEventListener("input", () => {
  const valid = phoneEl.value.trim();
  if (!valid) setError("phone", "Ingresa tu teléfono.");
  else if (!phoneRegex.test(valid)) setError("phone", "Teléfono inválido. Revisa el formato: +56 9 XXXXXXXX.");
  else setError("phone", "");
});

emailEl.addEventListener("input", () => {
  const valid = emailEl.value.trim();
  if (!valid) setError("email", "Ingresa tu email.");
  else if (!emailEl.checkValidity()) setError("email", "Email inválido.");
  else setError("email", "");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const valid = validate();
  if (!valid) {
    focusFirstInvalid();
    return;
  }

  const data = {
    full_name: nameEl.value.trim(),
    rut: rutEl.value.trim(),
    birthdate: birthEl.value,
    phone: phoneEl.value.trim(),
    email: emailEl.value.trim(),
  };

  try {
    const res = await fetch("/api/v1/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload?.detail || "Error al guardar");

    form.reset();

    [nameEl, rutEl, birthEl, phoneEl, emailEl].forEach((el) => {
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
    });
    rutEl.value = "";
    nameEl.focus();
  } catch (err) {
    console.log("error: ", err);
  }
});

document.getElementById("go-results")?.addEventListener("click", () => {
  window.location.href = "/results";
});

function cleanRutInput(v) {
  return (v || '').toString().replace(/[^0-9kK]/g, '').toUpperCase();
}

function splitRutClean(clean) {
  if (!clean) return { body: '', dv: '' };
  if (clean.length === 1) return { body: clean, dv: '' };
  return { body: clean.slice(0, -1), dv: clean.slice(-1) };
}

function fmtThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatRutFromClean(clean) {
  const { body, dv } = splitRutClean(clean);
  const bodyFmt = fmtThousands(body);
  return dv ? `${bodyFmt}-${dv}` : bodyFmt;
}

function computeDV(body) {
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul;
    mul = (mul === 7) ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
}

function isValidRut(value) {
  const clean = cleanRutInput(value);
  if (clean.length < 2) return false;
  const { body, dv } = splitRutClean(clean);
  if (!/^\d+$/.test(body)) return false;
  return computeDV(body) === dv;
}

function alnumCountUpTo(str, end) {
  let n = 0;
  for (let i = 0; i < Math.min(end, str.length); i++) {
    const ch = str[i].toUpperCase();
    if (/[0-9K]/.test(ch)) n++;
  }
  return n;
}

function caretFromAlnumIndex(formatted, index) {
  if (index <= 0) return 0;
  let n = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9K]/.test(formatted[i].toUpperCase())) {
      n++;
      if (n === index) return i + 1;
    }
  }
  return formatted.length;
}