/**
 * VIRTUAL LIST COMPONENT
 * 🔟 Virtual list - faqat ekrandagi elementlar render qilinadi
 * 1000 ta element bo'lsa ham tez ishlaydi
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function VirtualList({ 
  items = [], 
  itemHeight = 60, 
  containerHeight = 600,
  renderItem,
  overscan = 3 // Qo'shimcha render qilinadigan elementlar
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Ko'rinadigan elementlarni hisoblash
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  // Overscan bilan
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(items.length, visibleEnd + overscan);
  
  const visibleItems = items.slice(start, end);
  
  // Offset hisoblash
  const offsetY = start * itemHeight;
  
  // Total height
  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      className="virtual-list-container"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={start + index}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * VIRTUAL TABLE COMPONENT
 * Katta jadvallar uchun
 */
export function VirtualTable({ 
  data = [], 
  columns = [], 
  rowHeight = 50,
  containerHeight = 600 
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / rowHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight);
  const visibleRows = data.slice(visibleStart, visibleEnd);
  
  const offsetY = visibleStart * rowHeight;
  const totalHeight = data.length * rowHeight;

  return (
    <div
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="overflow-x-auto"
    >
      <table className="w-full" style={{ height: totalHeight }}>
        <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-sm font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleRows.map((row, rowIndex) => (
            <tr key={visibleStart + rowIndex} style={{ height: rowHeight }}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row) : row[col.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

