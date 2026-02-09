// Jest setup file
// Bu fayl har bir test faylidan oldin ishga tushadi

// Timeout'ni oshirish
jest.setTimeout(30000);

// Console log'larni cheklash (faqat xatolarni ko'rsatish)
global.console = {
  ...console,
  log: jest.fn(), // console.log'ni o'chirish
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn, // warning'larni qoldirish
  error: console.error, // error'larni qoldirish
};
