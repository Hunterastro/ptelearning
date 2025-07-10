const XLSX = require('xlsx');
const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// 解析Excel文件
const parseExcelFile = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // 使用第一个工作表
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // 使用数组格式而不是对象
      defval: '' // 空单元格的默认值
    });
    
    // 过滤空行
    const filteredData = jsonData.filter(row => 
      row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')
    );
    
    return {
      success: true,
      data: filteredData,
      rowCount: filteredData.length,
      message: `成功解析Excel文件，共${filteredData.length}行数据`
    };
  } catch (error) {
    console.error('Excel文件解析错误:', error);
    return {
      success: false,
      data: [],
      rowCount: 0,
      message: `Excel文件解析失败: ${error.message}`
    };
  }
};

// 解析CSV文件
const parseCSVFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 尝试检测分隔符
    let delimiter = ',';
    const commaCount = (fileContent.match(/,/g) || []).length;
    const semicolonCount = (fileContent.match(/;/g) || []).length;
    const tabCount = (fileContent.match(/\t/g) || []).length;
    
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    }
    
    const records = csv.parse(fileContent, {
      delimiter: delimiter,
      skip_empty_lines: true,
      trim: true
    });
    
    // 过滤空行
    const filteredData = records.filter(row => 
      row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')
    );
    
    return {
      success: true,
      data: filteredData,
      rowCount: filteredData.length,
      message: `成功解析CSV文件，共${filteredData.length}行数据`
    };
  } catch (error) {
    console.error('CSV文件解析错误:', error);
    return {
      success: false,
      data: [],
      rowCount: 0,
      message: `CSV文件解析失败: ${error.message}`
    };
  }
};

// 统一文件解析接口
const parseFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.xlsx':
    case '.xls':
      return parseExcelFile(filePath);
    case '.csv':
      return parseCSVFile(filePath);
    default:
      return {
        success: false,
        data: [],
        rowCount: 0,
        message: '不支持的文件格式'
      };
  }
};

// 验证和清理单词数据 - 适配新的文件格式
// 文件格式：Collocation | Sentence | Meaning | 中文翻译
const validateAndCleanWordData = (rawData, hasHeader = true) => {
  try {
    let dataToProcess = rawData;
    
    // 如果有标题行，跳过第一行
    if (hasHeader && dataToProcess.length > 0) {
      dataToProcess = dataToProcess.slice(1);
    }
    
    const validWords = [];
    const errors = [];
    
    dataToProcess.forEach((row, index) => {
      const rowNumber = hasHeader ? index + 2 : index + 1; // 考虑标题行
      
      // 确保至少有4列数据
      if (row.length < 4) {
        errors.push(`第${rowNumber}行: 数据列数不足，需要4列（Collocation, Sentence, Meaning, 中文翻译）`);
        return;
      }
      
      // 按照新的文件格式映射字段
      const collocation = (row[0] || '').toString().trim();    // 搭配词 -> phrase
      const sentence = (row[1] || '').toString().trim();       // 例句 -> example  
      const englishMeaning = (row[2] || '').toString().trim(); // 英文释义 -> translation
      const chineseTranslation = (row[3] || '').toString().trim(); // 中文翻译 -> meaning
      
      // 验证必填字段
      if (!collocation) {
        errors.push(`第${rowNumber}行: Collocation（搭配词）不能为空`);
        return;
      }
      
      if (!sentence) {
        errors.push(`第${rowNumber}行: Sentence（例句）不能为空`);
        return;
      }
      
      if (!englishMeaning) {
        errors.push(`第${rowNumber}行: Meaning（英文释义）不能为空`);
        return;
      }
      
      if (!chineseTranslation) {
        errors.push(`第${rowNumber}行: 中文翻译不能为空`);
        return;
      }
      
      // 长度验证
      if (collocation.length > 200) {
        errors.push(`第${rowNumber}行: Collocation过长（最多200字符）`);
        return;
      }
      
      if (chineseTranslation.length > 500) {
        errors.push(`第${rowNumber}行: 中文翻译过长（最多500字符）`);
        return;
      }
      
      if (sentence.length > 1000) {
        errors.push(`第${rowNumber}行: Sentence过长（最多1000字符）`);
        return;
      }
      
      if (englishMeaning.length > 1000) {
        errors.push(`第${rowNumber}行: Meaning过长（最多1000字符）`);
        return;
      }
      
      // 映射到系统期望的格式
      validWords.push({
        phrase: collocation,           // 搭配词作为短语
        meaning: chineseTranslation,   // 中文翻译作为释义
        example: sentence,             // 例句
        translation: englishMeaning    // 英文释义作为例句说明
      });
    });
    
    return {
      success: errors.length === 0,
      validWords,
      errors,
      totalRows: dataToProcess.length,
      validRows: validWords.length,
      message: errors.length === 0 
        ? `数据验证成功，共${validWords.length}个有效搭配词`
        : `数据验证完成，发现${errors.length}个错误`
    };
  } catch (error) {
    console.error('数据验证错误:', error);
    return {
      success: false,
      validWords: [],
      errors: [`数据验证失败: ${error.message}`],
      totalRows: 0,
      validRows: 0,
      message: '数据验证失败'
    };
  }
};

// 检测是否有标题行 - 适配新的文件格式
const detectHeader = (data) => {
  if (!data || data.length === 0) {
    return false;
  }
  
  const firstRow = data[0];
  if (!firstRow || firstRow.length < 4) {
    return false;
  }
  
  // 检查第一行是否包含您文件格式的标题关键词
  const headerKeywords = [
    'collocation', '搭配', '搭配词',
    'sentence', '例句', '句子',
    'meaning', '释义', '意思', '含义',
    'translation', 'chinese', '翻译', '中文', '中文翻译',
    // 保留原有关键词以兼容其他格式
    'phrase', 'word', 'english', '短语', '单词', '英文',
    'definition', 'example', '示例'
  ];
  
  const firstRowText = firstRow.join(' ').toLowerCase();
  const hasHeaderKeywords = headerKeywords.some(keyword => 
    firstRowText.includes(keyword.toLowerCase())
  );
  
  return hasHeaderKeywords;
};

// 生成数据预览 - 适配新的文件格式
const generatePreview = (data, maxRows = 5) => {
  if (!data || data.length === 0) {
    return [];
  }
  
  return data.slice(0, maxRows).map((row, index) => ({
    rowNumber: index + 1,
    collocation: (row[0] || '').toString().trim(),    // Collocation（搭配词）
    sentence: (row[1] || '').toString().trim(),       // Sentence（例句）
    meaning: (row[2] || '').toString().trim(),        // Meaning（英文释义）
    translation: (row[3] || '').toString().trim()     // 中文翻译
  }));
};

module.exports = {
  parseFile,
  parseExcelFile,
  parseCSVFile,
  validateAndCleanWordData,
  detectHeader,
  generatePreview
}; 