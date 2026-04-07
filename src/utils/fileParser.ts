import mammoth from 'mammoth';

/**
 * 从文件中提取文本内容
 * 支持 PDF（通过 PDF.js CDN）和 DOCX 格式
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileSize = file.size;

  console.log('[FileParser] 开始解析文件:', fileName, '大小:', fileSize);

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
 * 从 PDF 文件提取文本 - 使用动态加载
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // 动态导入 pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // 设置 worker - 使用版本化的 CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    console.log('[FileParser] PDF arrayBuffer 长度:', arrayBuffer.byteLength);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log('[FileParser] PDF 页数:', pdf.numPages);

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
    console.log('[FileParser] 提取的文本长度:', fullText.length);

    if (!fullText.trim()) {
      console.warn('[FileParser] PDF 没有提取到文字');
      throw new Error('该 PDF 为扫描版图片，无法提取文字。请使用文字版 PDF。');
    }

    return fullText;
  } catch (error) {
    console.error('[FileParser] PDF 解析详细错误:', error);

    // 检查是否是图片型 PDF
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('scan') || errorMsg.includes('image') || errorMsg.includes('No text')) {
      throw new Error('该 PDF 为扫描版图片，无法提取文字。请使用文字版 PDF。');
    }

    throw new Error('PDF 解析出错，请确保文件是有效的 PDF 文档');
  }
}

/**
 * 从 DOCX 文件提取文本
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    console.log('[FileParser] DOCX 提取成功, 文本长度:', result.value.length);

    if (!result.value.trim()) {
      throw new Error('Word 文档内容为空');
    }

    return result.value;
  } catch (error) {
    console.error('[FileParser] DOCX 解析详细错误:', error);
    throw new Error('Word 文档解析失败，请检查文件是否损坏');
  }
}