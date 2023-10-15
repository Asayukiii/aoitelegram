const SYNTAX = "[]\\;$";
const OPS = /[!=<>]+$/;
const FN_DEF = /[a-z_]/i;

type TokenString = { type: "string"; value: string };
type TokenNumber = { type: "number"; value: number };
type TokenCall = {
  type: "call";
  value: string;
  child: TokenArgument[];
  pos: number;
  line: number;
};
type TokenOpen = { type: "open" };
type TokenClose = { type: "close" };
type TokenNewArg = { type: "newArg" };
type TokenOperator = {
  type: "operator";
  value: "==" | "!=" | ">=" | "<=" | ">" | "<" | "!";
};
type TokenArgument = { type: "argument"; child: Token[] };
type TokenProgram = { type: "program"; child: Token[] };
type Token = { pos: number; line: number } & (
  | TokenArgument
  | TokenProgram
  | TokenString
  | TokenNumber
  | TokenCall
  | TokenOpen
  | TokenClose
  | TokenNewArg
  | TokenOperator
);

/**
 * The Lexer class is responsible for tokenizing input strings.
 */
class Lexer {
  pos = 0;
  line = 0;
  col = 0;
  escape_c = false;

  /**
   * Creates a new instance of the Lexer.
   * @param input - The input string to tokenize.
   */
  constructor(public input: string) {
    if (typeof input !== "string" || !input)
      throw new Error("input arg must be non-empty and of type string!");
  }

  /**
   * Tokenizes the input and returns an array of tokens.
   * @returns An array of tokens.
   */
  main() {
    const Tokens: Token[] = [];
    while (true) {
      let res = this.advance();
      if (res) Tokens.push(res);
      if (this.eof()) break;
    }
    return this.clean(Tokens);
  }

  /**
   * Peeks at a character in the input string without consuming it.
   * @param offset - The offset to peek (default is 0).
   * @returns The character at the specified offset.
   */
  peek(offset = 0) {
    return this.input[this.pos + offset];
  }

  /**
   * Advances to the next character in the input string and returns it.
   * Updates the line and column numbers.
   * @returns The current character.
   */
  next() {
    let current = this.input[this.pos++];
    if (this.peek() === "\n") {
      this.line += 1;
      this.col = 0;
    } else {
      this.col += 1;
    }
    return current;
  }

  /**
   * Checks if the end of the input string has been reached.
   * @returns True if the end of the input is reached, otherwise false.
   */
  eof() {
    return this.peek() === "" || this.peek() === undefined;
  }

  /**
   * Checks if a character is an operator.
   * @param x - The character to check.
   * @returns True if the character is an operator, otherwise false.
   */
  isOperator(x: string) {
    return OPS.test(x);
  }

  /**
   * Checks if a character is a syntax character.
   * @param c - The character to check.
   * @returns True if the character is a syntax character, otherwise false.
   */
  isSyntax(c: string) {
    return SYNTAX.indexOf(c) > -1;
  }

  /**
   * Checks if a string is a valid number.
   * @param x - The string to check.
   * @returns True if the string is a valid number, otherwise false.
   */
  isNumber(x: string) {
    return parseInt(x) === Number(x);
  }

  /**
   * Parses an operator character into a token.
   * @param x - The operator character to parse.
   * @returns A token representing the operator character.
   */
  parseOperator(x: string): Token {
    switch (x) {
      case "==":
      case "!=":
      case ">=":
      case "<=":
      case ">":
      case "<":
        return { type: "operator", value: x, pos: this.col, line: this.line };
    }
    return { type: "string", value: x, pos: this.col, line: this.line };
  }

  /**
   * Validates a call token and parses it.
   * @returns A parsed call token.
   */
  validateCall(c: string) {
    return FN_DEF.test(c);
  }

  /**
   * Parses a call token.
   * @returns A parsed call token.
   */
  parseCall(): Token {
    const fn = this.readInput(this.validateCall);
    if (!fn)
      return { type: "string", value: "$", pos: this.col, line: this.line };
    return {
      type: "call",
      value: "$" + fn,
      child: [],
      pos: this.col,
      line: this.line,
    };
  }

  /**
   * Validates a string token and parses it.
   * @returns A parsed string token.
   */
  validateString(c: string) {
    return !(this.isSyntax(c) || this.isOperator(c));
  }

  /**
   * Parses a string token.
   * @returns A parsed string token.
   */
  parseString(): Token {
    const str = this.readInput(this.validateString);
    if (this.isNumber(str))
      return {
        type: "number",
        value: Number(str),
        pos: this.col,
        line: this.line,
      };
    return { type: "string", value: str, pos: this.col, line: this.line };
  }

  /**
   * Reads and returns characters while they pass a validation function.
   * @param validator - The validation function for characters.
   * @returns A string composed of valid characters.
   */
  readInput(validator: (c: string) => boolean) {
    let str = "";
    while (!this.eof() && validator.apply(this, [this.peek()])) {
      str += this.next();
    }
    return str;
  }

  /**
   * Advances the lexer to the next character and returns a token.
   * @returns The parsed token.
   */
  advance(): Token | undefined {
    let c = this.peek();
    if (this.escape_c) {
      this.escape_c = false;
      this.next();
      if (this.isSyntax(c) || this.isOperator(c))
        return { type: "string", value: c, pos: this.col, line: this.line };
      return {
        type: "string",
        value: "\\" + c,
        pos: this.col,
        line: this.line,
      };
    }
    switch (c) {
      case "[": {
        this.next();
        return { type: "open", pos: this.col, line: this.line };
      }
      case "]": {
        this.next();
        return { type: "close", pos: this.col, line: this.line };
      }
      case ";": {
        this.next();
        return { type: "newArg", pos: this.col, line: this.line };
      }
      case "\\": {
        this.next();
        this.escape_c = true;
        return undefined;
      }
      case "$": {
        this.next();
        return this.parseCall();
      }
    }

    if (this.isOperator(c)) {
      this.next();
      if (this.isOperator(c + this.peek()))
        return this.parseOperator(c + this.next());
      return this.parseOperator(c);
    }
    return this.parseString();
  }

  /**
   * Cleans up adjacent string tokens by merging them.
   * @param tokens - An array of tokens to clean.
   * @returns The cleaned array of tokens.
   */
  clean(tokens: Token[]) {
    let newArr: Token[] = [];
    let token: Token | undefined;
    let current: Token | undefined;

    while (tokens.length > 0) {
      token = tokens.shift();
      if (!current) {
        current = token;
        continue;
      }

      if (current?.type === "string" && current?.type === token?.type) {
        current.value += token.value;
        continue;
      } else {
        if (current?.type !== "string") {
          newArr.push(current);
          current = token;
        } else {
          if (token?.type !== "string") {
            newArr.push(current);
            current = token;
          } else throw new Error("dunno wat to do");
        }
      }
    }

    if (current) newArr.push(current);
    token = undefined;
    current = undefined;

    return newArr;
  }
}

export {
  Lexer,
  Token,
  TokenString,
  TokenNumber,
  TokenArgument,
  TokenProgram,
  TokenCall,
  TokenOpen,
  TokenClose,
  TokenNewArg,
  TokenOperator,
};
