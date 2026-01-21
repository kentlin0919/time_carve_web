import { Portfolio, PortfolioMedia } from './entity';

export interface PortfolioRepository {
  // Queries
  getById(id: string): Promise<Portfolio | null>;
  getByTeacherId(teacherId: string): Promise<Portfolio[]>;
  getPublishedPortfolios(limit?: number): Promise<Portfolio[]>;
  
  // Commands
  create(data: Partial<Portfolio>): Promise<Portfolio>;
  update(id: string, data: Partial<Portfolio>): Promise<Portfolio>;
  delete(id: string): Promise<void>;
  
  // Media
  addMedia(data: Partial<PortfolioMedia>): Promise<PortfolioMedia>;
  deleteMedia(id: string): Promise<void>;
  updateMediaOrder(id: string, order: number): Promise<void>;
  
  // Tags
  updateTags(portfolioId: string, tagIds: string[]): Promise<void>;
}
