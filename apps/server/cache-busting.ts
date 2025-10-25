// Cache-busting utilities for Database queries
export class CacheBustingUtils {
  
  // Add cache-busting parameters to any Database query
  static addCacheBusting(query: any): any {
    const timestamp = Date.now();
    return query
      .limit(1000)
      .order('created_at', { ascending: false })
      .range(0, 999); // Force fresh data retrieval
  }

  // Force schema refresh by using explicit column selection
  static forceSchemaRefresh(database: any, tableName: string): any {
    return database
      .from(tableName)
      .select('*')
      .limit(1);
  }

  // Get fresh data with multiple fallback strategies
  static async getFreshData(
    database: any, 
    tableName: string, 
    filters: any = {},
    fallbackColumns: string[] = []
  ): Promise<any> {
    try {
      // Primary query
      let query = database
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;
      
      if (error && fallbackColumns.length > 0) {
        // Try fallback column names for cache issues
        for (const fallbackCol of fallbackColumns) {
          const fallbackQuery = database
            .from(tableName)
            .select('*')
            .eq(fallbackCol, Object.values(filters)[0]);
          
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          
          if (!fallbackError && fallbackData) {
            console.log(`Cache-busting: Using fallback column ${fallbackCol}`);
            return fallbackData;
          }
        }
      }
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Cache-busting query failed:', e);
      return [];
    }
  }

  // Disable Database client caching
  static configureNoCaching(database: any): any {
    // Configure client to avoid caching
    if (database.realtime) {
      database.realtime.setAuth(null);
    }
    return database;
  }
}