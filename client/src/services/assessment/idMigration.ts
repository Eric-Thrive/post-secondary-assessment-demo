
export class IdMigrationService {
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  migrateOldIdToUUID(assessmentCase: any): any {
    if (!this.isValidUUID(assessmentCase.id)) {
      console.log('Migrating old ID format to UUID:', assessmentCase.id);
      const newId = crypto.randomUUID();
      return {
        ...assessmentCase,
        id: newId,
        last_updated: new Date().toISOString()
      };
    }
    return assessmentCase;
  }
}

export const idMigrationService = new IdMigrationService();
