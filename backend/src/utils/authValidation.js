const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateRegistration = (body) => {
  const errors = [];

  if (!body.email || !body.email.trim()) {
    errors.push("Email is required");
  } else if (!isValidEmail(body.email)) {
    errors.push("Email is not valid");
  }

  if (!body.name || !body.name.trim()) {
    errors.push("Name is required");
  }

  if (!body.role || !["admin", "mahasiswa"].includes(body.role)) {
    errors.push("Role must be 'admin' or 'mahasiswa'");
  }

  if (!body.password || body.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(", "),
  };
};

const validateLogin = (body) => {
  const errors = [];

  if (!body.email || !body.email.trim()) {
    errors.push("Email is required");
  } else if (!isValidEmail(body.email)) {
    errors.push("Email is not valid");
  }

  if (!body.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    message: errors.join(", "),
  };
};

module.exports = { isValidEmail, validateRegistration, validateLogin };