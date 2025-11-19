import { marked } from 'marked';

// 定义节点和边的接口
export interface GraphNode {
  id: string;
  name: string;
  type: string;
  value: number;
  symbolSize: number;
  category: number;
  description?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  value?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: { name: string }[];
}

// 从 Markdown 提取知识图谱
export class KnowledgeExtractor {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private categories: Map<string, number> = new Map([
    ['章节', 0],
    ['概念', 1],
    ['关键词', 2],
    ['标题', 3],
  ]);

  // 解析 Markdown 文本
  parseMarkdown(markdown: string): GraphData {
    this.nodes.clear();
    this.edges = [];

    // 使用 marked 解析 Markdown
    const tokens = marked.lexer(markdown);
    
    let currentChapter: string | null = null;
    let currentSection: string | null = null;
    let lastHeading: string | null = null;

    tokens.forEach((token, index) => {
      if (token.type === 'heading') {
        const headingText = this.cleanText(token.text);
        const headingId = `heading_${index}_${headingText}`;

        // 根据标题级别确定类型
        let nodeType = '标题';
        let category = 3;
        
        if (token.depth === 1) {
          nodeType = '章节';
          category = 0;
          currentChapter = headingId;
          currentSection = null;
        } else if (token.depth === 2) {
          nodeType = '章节';
          category = 0;
          currentSection = headingId;
        }

        // 添加标题节点
        this.addNode(headingId, headingText, nodeType, category, 40 - token.depth * 5);

        // 建立层级关系
        if (token.depth === 2 && currentChapter) {
          this.addEdge(currentChapter, headingId, '包含');
        } else if (token.depth === 3 && currentSection) {
          this.addEdge(currentSection, headingId, '包含');
        } else if (token.depth > 3 && lastHeading) {
          this.addEdge(lastHeading, headingId, '包含');
        }

        lastHeading = headingId;
      } else if (token.type === 'paragraph' || token.type === 'text') {
        // 从段落中提取关键词和概念
        const text = this.cleanText(token.text || (token as any).raw || '');
        const keywords = this.extractKeywords(text);
        
        keywords.forEach(keyword => {
          const keywordId = `keyword_${keyword}`;
          
          // 添加关键词节点
          if (!this.nodes.has(keywordId)) {
            this.addNode(keywordId, keyword, '关键词', 2, 15);
          }

          // 关联到当前章节
          if (lastHeading) {
            this.addEdge(lastHeading, keywordId, '提及');
          }
        });
      } else if (token.type === 'list') {
        // 处理列表项
        const listItems = (token as any).items || [];
        listItems.forEach((item: any, itemIndex: number) => {
          const itemText = this.cleanText(item.text);
          if (itemText.length > 3 && itemText.length < 50) {
            const itemId = `concept_${index}_${itemIndex}_${itemText}`;
            this.addNode(itemId, itemText, '概念', 1, 20);
            
            if (lastHeading) {
              this.addEdge(lastHeading, itemId, '包含');
            }
          }
        });
      }
    });

    // 建立关键词之间的关联（共现关系）
    this.createKeywordConnections();

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      categories: Array.from(this.categories.keys()).map(name => ({ name })),
    };
  }

  // 添加节点
  private addNode(id: string, name: string, type: string, category: number, symbolSize: number) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        name,
        type,
        value: 1,
        symbolSize,
        category,
        description: `${type}: ${name}`,
      });
    } else {
      // 增加节点权重
      const node = this.nodes.get(id)!;
      node.value += 1;
      node.symbolSize = Math.min(symbolSize + node.value * 2, 60);
    }
  }

  // 添加边
  private addEdge(source: string, target: string, value: string = '相关') {
    // 避免重复边
    const edgeExists = this.edges.some(
      edge => edge.source === source && edge.target === target
    );
    
    if (!edgeExists && source !== target) {
      this.edges.push({ source, target, value });
    }
  }

  // 清理文本
  private cleanText(text: string): string {
    return text
      .replace(/[#*_`\[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 提取关键词（简单的基于规则的方法）
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 中文关键词提取（简单版本）
    const chinesePattern = /[\u4e00-\u9fa5]{2,8}/g;
    const matches = text.match(chinesePattern) || [];
    
    // 过滤常见词和短词
    const stopWords = new Set(['的', '了', '和', '是', '在', '有', '与', '等', '为', '以', '及', '或', '而', '但', '从', '到', '对', '于', '中', '这', '那', '个', '也', '都', '不', '可', '能', '要', '会', '就', '说', '我', '你', '他', '她', '它', '们', '我们', '你们', '他们']);
    
    matches.forEach(word => {
      if (word.length >= 2 && word.length <= 6 && !stopWords.has(word)) {
        keywords.push(word);
      }
    });

    // 去重并限制数量
    return [...new Set(keywords)].slice(0, 10);
  }

  // 创建关键词之间的连接（基于共现）
  private createKeywordConnections() {
    const keywordNodes = Array.from(this.nodes.values()).filter(
      node => node.type === '关键词'
    );

    // 找到关键词的共同父节点
    const keywordParents = new Map<string, Set<string>>();
    
    this.edges.forEach(edge => {
      const targetNode = this.nodes.get(edge.target);
      if (targetNode && targetNode.type === '关键词') {
        if (!keywordParents.has(edge.target)) {
          keywordParents.set(edge.target, new Set());
        }
        keywordParents.get(edge.target)!.add(edge.source);
      }
    });

    // 如果两个关键词有共同的父节点，建立连接
    const keywordIds = Array.from(keywordParents.keys());
    for (let i = 0; i < keywordIds.length; i++) {
      for (let j = i + 1; j < keywordIds.length; j++) {
        const parents1 = keywordParents.get(keywordIds[i])!;
        const parents2 = keywordParents.get(keywordIds[j])!;
        
        // 检查是否有共同父节点
        const hasCommonParent = Array.from(parents1).some(p => parents2.has(p));
        
        if (hasCommonParent) {
          this.addEdge(keywordIds[i], keywordIds[j], '共现');
        }
      }
    }
  }

  // 分析文本统计信息
  static analyzeText(markdown: string): {
    wordCount: number;
    headingCount: number;
    paragraphCount: number;
  } {
    const tokens = marked.lexer(markdown);
    
    const headingCount = tokens.filter(t => t.type === 'heading').length;
    const paragraphCount = tokens.filter(t => t.type === 'paragraph').length;
    const wordCount = markdown.length;

    return { wordCount, headingCount, paragraphCount };
  }
}
