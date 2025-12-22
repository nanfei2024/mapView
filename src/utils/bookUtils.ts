// 与书籍 / 目录重构相关的通用纯函数，便于在多个组件/页面复用

// 比较两个属性字符串（如 "4.2" 和 "4.10"）
export const compareProperties = (propA: string, propB: string): number => {
  if (propA === propB) return 0;
  if (!propA) return propB ? -1 : 0;
  if (!propB) return 1;

  const partsA = propA.split('.');
  const partsB = propB.split('.');
  const minLength = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < minLength; i++) {
    try {
      const numA = parseInt(partsA[i]);
      const numB = parseInt(partsB[i]);

      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) {
          return numA - numB;
        }
      } else {
        const strComp = partsA[i].localeCompare(partsB[i]);
        if (strComp !== 0) {
          return strComp;
        }
      }
    } catch {
      const strComp = partsA[i].localeCompare(partsB[i]);
      if (strComp !== 0) {
        return strComp;
      }
    }
  }

  return partsA.length - partsB.length;
};

// 从图片标题中提取图片编号（例如 “图1.2 a ...” -> "1.2"）
export const extractFigureNumber = (title: string): string | null => {
  const patterns = [
    /图\s*(\d+(?:\.\d+)*)/,
    /如图\s*(\d+(?:\.\d+)*)/,
    /图\s*(\d+(?:\.\d+)*)\s*[:：]/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};


