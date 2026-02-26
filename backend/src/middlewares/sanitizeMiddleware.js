const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const sanitizeString = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

const sanitizeObject = (input) => {
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      if (typeof item === "string") {
        input[index] = sanitizeString(item);
      } else {
        sanitizeObject(item);
      }
    });
    return input;
  }

  if (!isObject(input)) {
    if (typeof input === "string") {
      return sanitizeString(input);
    }
    return input;
  }

  Object.keys(input).forEach((key) => {
    const unsafeKey = key.startsWith("$") || key.includes(".");

    if (unsafeKey) {
      delete input[key];
      return;
    }

    const value = input[key];
    if (typeof value === "string") {
      input[key] = sanitizeString(value);
      return;
    }

    input[key] = sanitizeObject(value);
  });

  return input;
};

const sanitizeRequest = (req, _res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
};

module.exports = sanitizeRequest;
