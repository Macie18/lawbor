/**
 * PDF 解析服务
 * 用于从上传的 PDF 文件中提取文本内容
 */

import * as pdfjsLib from 'pdfjs-dist';

// ✅ 使用本地 worker 文件，避免 CDN 加载失败
// Vite 会自动处理 node_modules 中的文件
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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