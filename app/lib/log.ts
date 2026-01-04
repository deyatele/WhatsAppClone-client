import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "./store";

export const log = (...args: [string | number | null | object]) => {
  const first = args[0];
  if (typeof first === "string") {
    if (
      process.env.NEXT_PUBLIC_DEBUGING?.toLocaleLowerCase() === "true" &&
      first.includes("DEBUG")
    ) {
      console.log(String(args));
      useChatStore.getState().addLog({ id: uuidv4(), message: String(args) });
    }
    if (first.includes("ERROR")) console.error(String(args));
  }
};
