import os from "node:os";
import { AoiFunction } from "@structures/AoiFunction";

export default new AoiFunction()
  .setName("$getOsMachine")
  .setBrackets(false)
  .onCallback((context, func) => {
    return func.resolve(os.machine());
  });
