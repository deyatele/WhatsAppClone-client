"use client";

import { useChatStore } from "../../lib/store";

export const LogPanel = () => {
  const logs = useChatStore((state) => state.logs);

  return (
    <div className="w-full h-60 bg-gray-900 bg-opacity-80 p-4 overflow-y-auto font-mono text-xs text-white z-50">
      <h3 className="font-bold mb-2">[LOGS]</h3>
      {logs?.map((log) => (
        <p key={log.id} className="border-b border-gray-700 py-1">
          {log.message}
        </p>
      ))}
    </div>
  );
};
