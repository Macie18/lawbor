import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * 从文件中提取文本内容
 * 支持 PDF 和 DOCX 格式
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileSize = file.size;

  // 检查文件大小（最大 20MB）
  if (fileSize > 20 * 1024 * 1024) {
    throw new Error('文件过大，请选择小于 20MB 的文件');
  }

  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileName.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  } else if (fileName.endsWith('.doc')) {
    throw new Error('暂不支持 .doc 格式，请转换为 .docx 或 .pdf 后重试');
  } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
    throw new Error('图片格式暂不支持文本提取，请提供 PDF 或 Word 文档');
  } else {
    throw new Error('不支持的文件格式，请上传 PDF 或 DOCX 文件');
  }
}

/**
 * 从 PDF 文件提取文本
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      if (pageText.trim()) {
        textParts.push(pageText);
      }
    }

    const fullText = textParts.join('\n\n');

    if (!fullText.trim()) {
      throw new Error('PDF 文件内容为空或无法提取文字');
    }

    return fullText;
  } catch (error) {
    console.error('[FileParser] PDF 解析失败:', error);
    throw new Error('PDF 文件解析失败，请确保文件不是扫描版图片');
  }
}

/**
 * 从 DOCX 文件提取文本
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value.trim()) {
      throw new Error('Word 文档内容为空');
    }

    return result.value;
  } catch (error) {
    console.error('[FileParser] DOCX 解析失败:', error);
    throw new Error('Word 文档解析失败，请检查文件是否损坏');
  }
}