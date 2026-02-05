/**
 * PAGINATION MIDDLEWARE
 * 1️⃣ Productlarni bo'lib yuklash
 * Katta ro'yxatlarni sahifalash uchun
 */

export const paginate = (req, res, next) => {
  // Default qiymatlar
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20; // Default 20 ta
  const maxLimit = 100; // Maksimal 100 ta
  
  // Limit ni cheklash
  const validLimit = Math.min(limit, maxLimit);
  
  // Offset hisoblash
  const offset = (page - 1) * validLimit;
  
  // Pagination ma'lumotlarini req ga qo'shish
  req.pagination = {
    page,
    limit: validLimit,
    offset,
    skip: offset // MongoDB uchun ham
  };
  
  next();
};

/**
 * CURSOR-BASED PAGINATION
 * 4️⃣ Skip emas, cursor ishlatish
 * Katta bazada tezroq ishlaydi
 */
export const cursorPaginate = (req, res, next) => {
  const limit = parseInt(req.query.limit) || 20;
  const cursor = req.query.cursor; // Oxirgi element ID yoki timestamp
  const maxLimit = 100;
  
  const validLimit = Math.min(limit, maxLimit);
  
  req.cursorPagination = {
    limit: validLimit,
    cursor,
    hasMore: false // Query natijasida to'ldiriladi
  };
  
  next();
};

/**
 * PAGINATION RESPONSE HELPER
 * Response formatini standartlashtirish
 */
export const paginationResponse = (data, total, req) => {
  const { page, limit } = req.pagination || { page: 1, limit: 20 };
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * CURSOR PAGINATION RESPONSE HELPER
 */
export const cursorPaginationResponse = (data, req) => {
  const { limit } = req.cursorPagination;
  const hasMore = data.length > limit;
  
  // Agar ortiqcha element bo'lsa, uni olib tashlash
  if (hasMore) {
    data = data.slice(0, limit);
  }
  
  // Keyingi cursor
  const nextCursor = hasMore && data.length > 0 
    ? data[data.length - 1].id || data[data.length - 1].created_at 
    : null;
  
  return {
    success: true,
    data,
    pagination: {
      limit,
      hasMore,
      nextCursor
    }
  };
};
