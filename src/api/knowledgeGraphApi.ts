/**
 * 知识图谱API
 */

import type { Entity, Relation, KnowledgeGraph } from '@/utils/knowledgeGraphExtractor';

const BASE_URL = 'http://localhost:8080';

export interface KnowledgeGraphResponse {
  success: boolean;
  data?: KnowledgeGraph;
  error?: string;
}

export interface EntitySearchResponse {
  success: boolean;
  data?: Entity[];
  total?: number;
  error?: string;
}

export interface RelationSearchResponse {
  success: boolean;
  data?: Relation[];
  total?: number;
  error?: string;
}

export interface PathResponse {
  success: boolean;
  data?: {
    path: string[];
    entities: Entity[];
    relations: Relation[];
  };
  error?: string;
}

export interface StatisticsResponse {
  success: boolean;
  data?: {
    totalEntities: number;
    totalRelations: number;
    entityTypes: Record<string, number>;
    relationTypes: Record<string, number>;
    documentsCount: number;
  };
  error?: string;
}

/**
 * 通用API请求处理
 */
async function handleApiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[知识图谱API错误]', error);
    throw error;
  }
}

export const knowledgeGraphApi = {
  /**
   * 从Markdown文档提取知识图谱
   */
  async extractFromMarkdown(
    markdown: string,
    documentId: string,
    options?: {
      sourceChapter?: string;
      sourceSection?: string;
    }
  ): Promise<KnowledgeGraphResponse> {
    return handleApiRequest<KnowledgeGraphResponse>(
      `${BASE_URL}/api/knowledge-graph/extract`,
      {
        method: 'POST',
        body: JSON.stringify({
          markdown,
          documentId,
          ...options
        })
      }
    );
  },

  /**
   * 从文档ID提取知识图谱（后端会获取markdown内容）
   */
  async extractFromDocument(documentId: string): Promise<KnowledgeGraphResponse> {
    return handleApiRequest<KnowledgeGraphResponse>(
      `${BASE_URL}/api/knowledge-graph/extract/${documentId}`,
      {
        method: 'POST'
      }
    );
  },

  /**
   * 获取文档的知识图谱
   */
  async getGraph(documentId: string): Promise<KnowledgeGraphResponse> {
    return handleApiRequest<KnowledgeGraphResponse>(
      `${BASE_URL}/api/knowledge-graph/${documentId}`
    );
  },

  /**
   * 搜索实体
   */
  async searchEntities(
    query: string,
    filters?: {
      type?: string;
      documentId?: string;
      limit?: number;
    }
  ): Promise<EntitySearchResponse> {
    const params = new URLSearchParams({
      q: query,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.documentId && { documentId: filters.documentId }),
      ...(filters?.limit && { limit: filters.limit.toString() })
    });

    return handleApiRequest<EntitySearchResponse>(
      `${BASE_URL}/api/knowledge-graph/entities/search?${params.toString()}`
    );
  },

  /**
   * 获取实体详情
   */
  async getEntity(entityId: string): Promise<{ success: boolean; data?: Entity; error?: string }> {
    return handleApiRequest<{ success: boolean; data?: Entity; error?: string }>(
      `${BASE_URL}/api/knowledge-graph/entities/${entityId}`
    );
  },

  /**
   * 获取实体的关系
   */
  async getEntityRelations(
    entityId: string,
    relationTypes?: string[]
  ): Promise<RelationSearchResponse> {
    const params = new URLSearchParams();
    if (relationTypes && relationTypes.length > 0) {
      params.append('types', relationTypes.join(','));
    }

    return handleApiRequest<RelationSearchResponse>(
      `${BASE_URL}/api/knowledge-graph/entities/${entityId}/relations?${params.toString()}`
    );
  },

  /**
   * 查找两个实体之间的路径
   */
  async findPath(
    sourceId: string,
    targetId: string,
    maxDepth: number = 5
  ): Promise<PathResponse> {
    const params = new URLSearchParams({
      source: sourceId,
      target: targetId,
      maxDepth: maxDepth.toString()
    });

    return handleApiRequest<PathResponse>(
      `${BASE_URL}/api/knowledge-graph/path?${params.toString()}`
    );
  },

  /**
   * 更新实体
   */
  async updateEntity(
    entityId: string,
    data: Partial<Entity>
  ): Promise<{ success: boolean; data?: Entity; error?: string }> {
    return handleApiRequest<{ success: boolean; data?: Entity; error?: string }>(
      `${BASE_URL}/api/knowledge-graph/entities/${entityId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  },

  /**
   * 创建关系
   */
  async createRelation(relation: Omit<Relation, 'id'>): Promise<{
    success: boolean;
    data?: Relation;
    error?: string;
  }> {
    return handleApiRequest<{ success: boolean; data?: Relation; error?: string }>(
      `${BASE_URL}/api/knowledge-graph/relations`,
      {
        method: 'POST',
        body: JSON.stringify(relation)
      }
    );
  },

  /**
   * 删除实体
   */
  async deleteEntity(entityId: string): Promise<{ success: boolean; error?: string }> {
    return handleApiRequest<{ success: boolean; error?: string }>(
      `${BASE_URL}/api/knowledge-graph/entities/${entityId}`,
      {
        method: 'DELETE'
      }
    );
  },

  /**
   * 获取图谱统计信息
   */
  async getStatistics(documentId?: string): Promise<StatisticsResponse> {
    const url = documentId
      ? `${BASE_URL}/api/knowledge-graph/statistics?documentId=${documentId}`
      : `${BASE_URL}/api/knowledge-graph/statistics`;

    return handleApiRequest<StatisticsResponse>(url);
  }
};

