import { v4 as uuidv4 } from "uuid";
import { useChatStore } from "./store";

export const log = (...args: [string | number | null | object]) => {
  console.log(String(args));
  useChatStore.getState().addLog({ id: uuidv4(), message: String(args) });
};
