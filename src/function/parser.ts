/**
 * Checks if a string represents a valid integer.
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string is a valid integer, otherwise false.
 */
function isInteger(content: string) {
  let isBigInt: boolean = false;
  try {
    BigInt(content);
    isBigInt = true;
  } catch (err) {
    isBigInt = false;
  }
  return (
    Number.isInteger(Number(content)) &&
    !isBoolean(content) &&
    !isNull(content) &&
    isBigInt
  );
}

/**
 * Checks if a string represents a valid floating-point number.
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string is a valid floating-point number, otherwise false.
 */
function isFloat(content: string) {
  if (!content.includes(".")) return false;
  if (!Number.isNaN(parseFloat(content))) return true;
  else return false;
}

/**
 * Checks if a string represents a boolean value ("true" or "false").
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string represents a boolean value, otherwise false.
 */
function isBoolean(content: string) {
  if (content === "true") return true;
  else if (content === "false") return true;
  else return false;
}

/**
 * Checks if a string represents the value null.
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string represents the value null, otherwise false.
 */
function isNull(content: string) {
  if (content === "null") return true;
  else return false;
}

/**
 * Checks if a string represents a valid JSON object.
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string is a valid JSON object, otherwise false.
 */
function isObject(content: string) {
  if (content?.startsWith("{") && content.endsWith("}")) {
    try {
      return !!JSON.parse(content);
    } catch (err) {
      return false;
    }
  }
  return false;
}

/**
 * Checks if a string represents the value "undefined".
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string represents the value "undefined", otherwise false.
 */
function isUndefined(content: string) {
  if (content === "undefined") return true;
  else return false;
}

/**
 * Checks if a string represents the value "NaN".
 * @param {string} content - The string to check.
 * @returns {boolean} True if the string represents the value "NaN", otherwise false.
 */
function isNaN(content: string) {
  if (content === "NaN") return true;
  else return false;
}

/**
 * Checks typeof value.
 * @param {string} character - The string to check.
 */
function parse(character: string) {
  switch (true) {
    case isInteger(character):
      return parseInt(character);
    case isFloat(character):
      return parseFloat(character);
    case isNaN(character):
      return NaN;
    case isObject(character):
      return JSON.parse(character);
    case isBoolean(character):
      return character === "true" ? true : false;
    case isNull(character):
      return null;
    case isUndefined(character):
      return undefined;
    default:
      return character;
  }
}

export { parse };
