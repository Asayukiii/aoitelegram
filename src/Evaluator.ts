import { Context } from "./Context";
import { Token, TokenArgument, TokenCall, TokenProgram } from "./Lexer";

/**
 * The Evaluator class is responsible for evaluating the Abstract Syntax Tree (AST).
 */
class Evaluator {
  static singleton = new Evaluator();

  /**
   * Creates a new instance of the Evaluator.
   */
  constructor() {}

  /**
   * Evaluates an AST and returns the result.
   * @param ast - The Abstract Syntax Tree to evaluate.
   * @param ctx - The context in which to evaluate the AST.
   * @returns The result of the evaluation.
   */
  async evaluate(ast: TokenProgram, ctx: Context) {
    const res = await this.visitArgument(ast, ctx);

    // Trim the output if required
    if (ctx.options.trimOutput && typeof res === "string") return res.trim();

    return res;
  }

  /**
   * Visits a node in the AST and returns the result.
   * @param node - The node to visit.
   * @param ctx - The context in which to visit the node.
   * @returns The result of visiting the node.
   */
  visit(node: Token, ctx: Context): any {
    if (node.type === "string") return node.value;
    if (node.type === "number") return node.value;
    if (node.type === "operator") return node.value;
    if (node.type === "call") return this.visitCall(node, ctx);
    if (node.type === "argument") return this.visitArgument(node, ctx);
    throw new Error("Unknown type of " + node.type + "!");
  }

  /**
   * Visits a call node in the AST and returns the result.
   * @param node - The call node to visit.
   * @param ctx - The context in which to visit the call node.
   * @returns The result of visiting the call node.
   */
  visitCall(node: TokenCall, ctx: Context) {
    return ctx.callIdentifier(node);
  }

  /**
   * Visits an argument node in the AST and returns the result.
   * @param arg - The argument node to visit.
   * @param ctx - The context in which to visit the argument node.
   * @param map - Whether to map the values or return an array.
   * @returns The result of visiting the argument node.
   */
  async visitArgument(
    arg: TokenProgram | TokenArgument,
    ctx: Context,
    map = true,
  ): Promise<any> {
    let arr = arg.child?.copyWithin(-1, -1) ?? [];
    let v = [];

    while (arr?.length > 0) {
      let node = arr.shift() as Token;
      let res = await this.visit(node, ctx);
      v.push(res);
    }

    return map ? this.mapValues(v) : v;
  }

  /**
   * Maps an array of values to a single value.
   * @param values - The array of values to map.
   * @returns The mapped value.
   */
  async mapValues(values: any[]) {
    if (values.length <= 1) return values[0];

    return (await Promise.all(values.map(async (v) => String(await v)))).join(
      "",
    );
  }
}

export { Evaluator };
