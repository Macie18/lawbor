/**
 * PDF 解析服务
 * 用于从上传的 PDF 文件中提取文本内容
 */

import * as pdfjsLib from 'pdfjs-dist';

// 设置 worker（浏览器端使用 jsDelivr CDN，比 cdnjs 更稳定）
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ParsedPDF {
  text: string;
  pageCount: number;
  fileName: string;
}

/**
 * 解析 PDF 文件，提取文本内容
 * @param file - 上传的 PDF 文件
 * @returns 解析后的 PDF 内容
 */
export async function parsePDF(file: File): Promise<ParsedPDF> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const pageCount = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return {
    text: fullText.trim(),
    pageCount,
    fileName: file.name,
  };
}

/**
 * 验证文件是否为 PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}