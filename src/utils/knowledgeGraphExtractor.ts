/**
 * 知识图谱提取工具
 * 从Markdown内容中提取实体和关系
 */

export interface Entity {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties?: Record<string, any>;
  sourceChapter?: string;
  sourceSection?: string;
  sourceDocumentId?: string;
  confidence?: number;
}

export interface Relation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  description?: string;
  sourceText?: string;
  sourceDocumentId?: string;
  confidence?: number;
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
  statistics: {
    totalEntities: number;
    totalRelations: number;
    entityTypes: Record<string, number>;
    relationTypes: Record<string, number>;
  };
}

/**
 * 地质学术语词典
 */
const GEOLOGY_TERMS = {
  // 地质构造
  structures: [
    '区系', '板块', '带', '构造', '褶皱', '断层', '断裂', '隆起', '凹陷',
    '地台', '地槽', '地盾', '造山带', '裂谷', '海沟', '海岭'
  ],
  // 地质现象
  phenomena: [
    '运动', '活动', '造山', '岩浆', '火山', '地震', '变质', '沉积',
    '侵蚀', '风化', '剥蚀', '堆积', '抬升', '沉降', '漂移'
  ],
  // 地理位置
  locations: [
    '大陆', '海洋', '洋', '海', '陆间带', '陆缘', '盆地', '高原',
    '山脉', '平原', '岛屿', '半岛'
  ],
  // 地质年代
  ages: [
    '代', '纪', '世', '期', '古生代', '中生代', '新生代', '元古代',
    '太古代', '寒武纪', '奥陶纪', '志留纪', '泥盆纪', '石炭纪', '二叠纪',
    '三叠纪', '侏罗纪', '白垩纪', '古近纪', '新近纪', '第四纪'
  ],
  // 理论和方法
  theories: [
    '理论', '学说', '假说', '模型', '方法', '技术', '测量', '分析',
    '研究', '观测', '实验'
  ]
};

/**
 * 关系模式
 */
const RELATION_PATTERNS = [
  {
    type: 'belongs_to',
    patterns: [
      /(.+?)属于(.+?)[。，、；：]/g,
      /(.+?)是(.+?)的一部分/g,
      /(.+?)隶属于(.+?)[。，、；：]/g,
      /(.+?)归入(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'causes',
    patterns: [
      /(.+?)导致(.+?)[。，、；：]/g,
      /(.+?)引起(.+?)[。，、；：]/g,
      /(.+?)造成(.+?)[。，、；：]/g,
      /(.+?)促使(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'forms',
    patterns: [
      /(.+?)形成(.+?)[。，、；：]/g,
      /(.+?)产生(.+?)[。，、；：]/g,
      /(.+?)生成(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'located_in',
    patterns: [
      /(.+?)位于(.+?)[。，、；：]/g,
      /(.+?)处在(.+?)[。，、；：]/g,
      /(.+?)分布于(.+?)[。，、；：]/g,
      /(.+?)存在于(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'occurs_in',
    patterns: [
      /(.+?)发生于(.+?)[。，、；：]/g,
      /(.+?)形成于(.+?)[。，、；：]/g,
      /(.+?)出现在(.+?)时期/g,
      /(.+?)时代(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'related_to',
    patterns: [
      /(.+?)与(.+?)相关/g,
      /(.+?)和(.+?)有关/g,
      /(.+?)联系(.+?)[。，、；：]/g
    ]
  },
  {
    type: 'contains',
    patterns: [
      /(.+?)包含(.+?)[。，、；：]/g,
      /(.+?)包括(.+?)[。，、；：]/g,
      /(.+?)涵盖(.+?)[。，、；：]/g
    ]
  }
];

/**
 * 从文本中提取地质术语
 */
function extractGeologicalTerms(text: string): string[] {
  const terms: Set<string> = new Set();
  
  // 提取包含地质术语的短语
  const allTerms = [
    ...GEOLOGY_TERMS.structures,
    ...GEOLOGY_TERMS.phenomena,
    ...GEOLOGY_TERMS.locations,
    ...GEOLOGY_TERMS.ages,
    ...GEOLOGY_TERMS.theories
  ];
  
  allTerms.forEach(term => {
    // 匹配包含该术语的完整短语（前后有中文字符）
    const regex = new RegExp(`[\\u4e00-\\u9fa5]*${term}[\\u4e00-\\u9fa5]*`, 'g');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        // 过滤掉太长的短语（可能是误匹配）
        if (match.length <= 10 && match.length >= 2) {
          terms.add(match);
        }
      });
    }
  });
  
  // 提取常见的命名实体模式
  const patterns = [
    /([\u4e00-\u9fa5]{2,8}区系)/g,
    /([\u4e00-\u9fa5]{2,8}板块)/g,
    /([\u4e00-\u9fa5]{2,8}带)/g,
    /([\u4e00-\u9fa5]{2,8}运动)/g,
    /([\u4e00-\u9fa5]{2,8}构造)/g,
    /([\u4e00-\u9fa5]{2,8}理论)/g,
    /([\u4e00-\u9fa5]{2,8}学说)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => terms.add(match));
    }
  });
  
  return Array.from(terms);
}

/**
 * 判断实体类型
 */
function detectEntityType(term: string): string {
  if (GEOLOGY_TERMS.structures.some(t => term.includes(t))) {
    return 'geological_structure';
  }
  if (GEOLOGY_TERMS.phenomena.some(t => term.includes(t))) {
    return 'geological_phenomenon';
  }
  if (GEOLOGY_TERMS.locations.some(t => term.includes(t))) {
    return 'location';
  }
  if (GEOLOGY_TERMS.ages.some(t => term.includes(t))) {
    return 'geological_age';
  }
  if (GEOLOGY_TERMS.theories.some(t => term.includes(t))) {
    return 'theory';
  }
  if (term.includes('章') || term.includes('节') || term.includes('部分')) {
    return 'chapter';
  }
  return 'concept';
}

/**
 * 从Markdown内容中提取实体
 */
export function extractEntitiesFromMarkdown(
  markdown: string,
  options: {
    sourceDocumentId?: string;
    sourceChapter?: string;
    sourceSection?: string;
  } = {}
): Entity[] {
  const entities: Entity[] = [];
  const entityMap = new Map<string, Entity>();
  
  // 1. 从标题中提取（Markdown标题格式）
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const terms = extractGeologicalTerms(title);
    
    terms.forEach(term => {
      if (!entityMap.has(term)) {
        const entity: Entity = {
          id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: term,
          type: detectEntityType(term),
          sourceChapter: options.sourceChapter,
          sourceSection: options.sourceSection,
          sourceDocumentId: options.sourceDocumentId,
          confidence: 0.8
        };
        entityMap.set(term, entity);
        entities.push(entity);
      }
    });
  }
  
  // 2. 从正文中提取
  // 移除Markdown语法，获取纯文本
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]+`/g, '') // 移除行内代码
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '') // 移除图片
    .replace(/^#{1,6}\s+/gm, '') // 移除标题标记
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // 移除粗体
    .replace(/\*([^\*]+)\*/g, '$1') // 移除斜体
    .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
    .replace(/^\s*\d+\.\s+/gm, ''); // 移除有序列表标记
  
  // 按句子分割
  const sentences = plainText.split(/[。！？\n]/).filter(s => s.trim().length > 5);
  
  sentences.forEach(sentence => {
    const terms = extractGeologicalTerms(sentence);
    terms.forEach(term => {
      if (!entityMap.has(term)) {
        const entity: Entity = {
          id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: term,
          type: detectEntityType(term),
          description: sentence.substring(0, 100), // 使用句子作为描述
          sourceChapter: options.sourceChapter,
          sourceSection: options.sourceSection,
          sourceDocumentId: options.sourceDocumentId,
          confidence: 0.6
        };
        entityMap.set(term, entity);
        entities.push(entity);
      }
    });
  });
  
  return entities;
}

/**
 * 从Markdown内容中提取关系
 */
export function extractRelationsFromMarkdown(
  markdown: string,
  entities: Entity[],
  options: {
    sourceDocumentId?: string;
  } = {}
): Relation[] {
  const relations: Relation[] = [];
  const entityNameMap = new Map<string, Entity>();
  
  // 建立实体名称到实体的映射
  entities.forEach(entity => {
    entityNameMap.set(entity.name, entity);
  });
  
  // 移除Markdown语法，获取纯文本
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^\*]+)\*\*/g, '$1')
    .replace(/\*([^\*]+)\*/g, '$1');
  
  // 按句子分割
  const sentences = plainText.split(/[。！？\n]/).filter(s => s.trim().length > 5);
  
  // 使用关系模式提取
  RELATION_PATTERNS.forEach(({ type, patterns }) => {
    patterns.forEach(pattern => {
      sentences.forEach(sentence => {
        let match;
        while ((match = pattern.exec(sentence)) !== null) {
          const sourceName = match[1].trim();
          const targetName = match[2].trim();
          
          const sourceEntity = entityNameMap.get(sourceName);
          const targetEntity = entityNameMap.get(targetName);
          
          // 如果找不到精确匹配，尝试模糊匹配
          const sourceEntityFuzzy = sourceEntity || 
            Array.from(entityNameMap.values()).find(e => sourceName.includes(e.name) || e.name.includes(sourceName));
          const targetEntityFuzzy = targetEntity || 
            Array.from(entityNameMap.values()).find(e => targetName.includes(e.name) || e.name.includes(targetName));
          
          if (sourceEntityFuzzy && targetEntityFuzzy && sourceEntityFuzzy.id !== targetEntityFuzzy.id) {
            // 检查关系是否已存在
            const existingRelation = relations.find(
              r => r.sourceEntityId === sourceEntityFuzzy.id && 
                   r.targetEntityId === targetEntityFuzzy.id && 
                   r.type === type
            );
            
            if (!existingRelation) {
              relations.push({
                id: `relation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sourceEntityId: sourceEntityFuzzy.id,
                targetEntityId: targetEntityFuzzy.id,
                type,
                sourceText: match[0],
                sourceDocumentId: options.sourceDocumentId,
                confidence: sourceEntity && targetEntity ? 0.8 : 0.5
              });
            }
          }
        }
      });
    });
  });
  
  // 共现分析：统计在同一句子中出现的实体对
  const cooccurrence = new Map<string, { count: number; sentences: string[] }>();
  
  sentences.forEach(sentence => {
    const entitiesInSentence = entities.filter(e => sentence.includes(e.name));
    
    // 生成实体对
    for (let i = 0; i < entitiesInSentence.length; i++) {
      for (let j = i + 1; j < entitiesInSentence.length; j++) {
        const pair = [entitiesInSentence[i].id, entitiesInSentence[j].id]
          .sort()
          .join('-');
        
        if (!cooccurrence.has(pair)) {
          cooccurrence.set(pair, { count: 0, sentences: [] });
        }
        
        const pairData = cooccurrence.get(pair)!;
        pairData.count++;
        if (pairData.sentences.length < 3) {
          pairData.sentences.push(sentence);
        }
      }
    }
  });
  
  // 将高频共现转换为关系
  cooccurrence.forEach((data, pair) => {
    if (data.count >= 3) {
      const [sourceId, targetId] = pair.split('-');
      
      // 检查关系是否已存在
      const existingRelation = relations.find(
        r => (r.sourceEntityId === sourceId && r.targetEntityId === targetId) ||
             (r.sourceEntityId === targetId && r.targetEntityId === sourceId)
      );
      
      if (!existingRelation) {
        relations.push({
          id: `relation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          type: 'related_to',
          sourceText: data.sentences[0],
          sourceDocumentId: options.sourceDocumentId,
          confidence: Math.min(data.count / 10, 1.0)
        });
      }
    }
  });
  
  return relations;
}

/**
 * 从Markdown构建完整的知识图谱
 */
export function buildKnowledgeGraphFromMarkdown(
  markdown: string,
  options: {
    sourceDocumentId?: string;
    sourceChapter?: string;
    sourceSection?: string;
  } = {}
): KnowledgeGraph {
  // 1. 提取实体
  const entities = extractEntitiesFromMarkdown(markdown, options);
  
  // 2. 提取关系
  const relations = extractRelationsFromMarkdown(markdown, entities, options);
  
  // 3. 统计信息
  const entityTypes: Record<string, number> = {};
  const relationTypes: Record<string, number> = {};
  
  entities.forEach(entity => {
    entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
  });
  
  relations.forEach(relation => {
    relationTypes[relation.type] = (relationTypes[relation.type] || 0) + 1;
  });
  
  return {
    entities,
    relations,
    statistics: {
      totalEntities: entities.length,
      totalRelations: relations.length,
      entityTypes,
      relationTypes
    }
  };
}

/**
 * 合并多个知识图谱
 */
export function mergeKnowledgeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph {
  const entityMap = new Map<string, Entity>();
  const relationMap = new Map<string, Relation>();
  
  graphs.forEach(graph => {
    // 合并实体（去重）
    graph.entities.forEach(entity => {
      const existing = entityMap.get(entity.name);
      if (existing) {
        // 合并属性
        existing.properties = { ...existing.properties, ...entity.properties };
        if (entity.confidence && (!existing.confidence || entity.confidence > existing.confidence)) {
          existing.confidence = entity.confidence;
        }
      } else {
        entityMap.set(entity.name, { ...entity });
      }
    });
    
    // 合并关系（去重）
    graph.relations.forEach(relation => {
      const key = `${relation.sourceEntityId}-${relation.targetEntityId}-${relation.type}`;
      if (!relationMap.has(key)) {
        relationMap.set(key, { ...relation });
      }
    });
  });
  
  // 重新映射关系中的实体ID（因为实体可能被合并）
  const idMapping = new Map<string, string>();
  entityMap.forEach((entity, name) => {
    idMapping.set(entity.id, entity.id);
  });
  
  // 建立ID到实体的映射
  const idToEntityMap = new Map<string, Entity>();
  entityMap.forEach(entity => {
    idToEntityMap.set(entity.id, entity);
  });
  
  // 收集所有原始实体ID（用于查找）
  const allOriginalEntityIds = new Set<string>();
  graphs.forEach(graph => {
    graph.entities.forEach(entity => {
      allOriginalEntityIds.add(entity.id);
    });
  });
  
  const relations = Array.from(relationMap.values()).map(relation => {
    // 先尝试通过ID直接查找
    let sourceEntity = idToEntityMap.get(relation.sourceEntityId);
    let targetEntity = idToEntityMap.get(relation.targetEntityId);
    
    // 如果找不到，尝试通过原始ID查找对应的实体
    if (!sourceEntity) {
      // 从原始图中查找源实体
      for (const graph of graphs) {
        const originalEntity = graph.entities.find(e => e.id === relation.sourceEntityId);
        if (originalEntity) {
          sourceEntity = entityMap.get(originalEntity.name);
          break;
        }
      }
    }
    
    if (!targetEntity) {
      // 从原始图中查找目标实体
      for (const graph of graphs) {
        const originalEntity = graph.entities.find(e => e.id === relation.targetEntityId);
        if (originalEntity) {
          targetEntity = entityMap.get(originalEntity.name);
          break;
        }
      }
    }
    
    if (sourceEntity && targetEntity) {
      return {
        ...relation,
        sourceEntityId: sourceEntity.id,
        targetEntityId: targetEntity.id
      };
    }
    return null;
  }).filter((r): r is Relation => r !== null);
  
  // 统计信息
  const entityTypes: Record<string, number> = {};
  const relationTypes: Record<string, number> = {};
  
  entityMap.forEach(entity => {
    entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
  });
  
  relations.forEach(relation => {
    relationTypes[relation.type] = (relationTypes[relation.type] || 0) + 1;
  });
  
  return {
    entities: Array.from(entityMap.values()),
    relations,
    statistics: {
      totalEntities: entityMap.size,
      totalRelations: relations.length,
      entityTypes,
      relationTypes
    }
  };
}

