/**
 * GameLog.jsx - 게임 로그 표시
 */
import React, { useRef, useEffect, useState } from 'react';

export default function GameLog({ logs }) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) return null;

  const lastLog = logs[logs.length - 1];

  return (
    <div className="bg-poker-dark-lighter border-t border-gray-800">
      {/* 접힌 상태: 마지막 로그만 표시 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-1.5 flex items-center justify-between text-left"
      >
        <span className="text-gray-400 text-xs truncate flex-1">
          {lastLog.message}
        </span>
        <span className="text-gray-600 text-xs ml-2">
          {expanded ? '▼' : '▲'}
        </span>
      </button>

      {/* 펼친 상태: 전체 로그 */}
      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-32 overflow-y-auto px-4 pb-2 animate-slide-up"
        >
          {logs.map((log, i) => (
            <p key={i} className="text-xs text-gray-500 py-0.5">
              {log.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
