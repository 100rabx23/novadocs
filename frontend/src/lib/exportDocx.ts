import { 
  Document as DocxDocument, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table as DocxTable, 
  TableRow as DocxTableRow, 
  TableCell as DocxTableCell, 
  WidthType, 
  BorderStyle, 
  ImageRun,
  AlignmentType,
  ExternalHyperlink
} from 'docx';
import { saveAs } from 'file-saver';

// Helper to convert an image URL (including base64) to ArrayBuffer
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    if (url.startsWith('data:')) {
      const response = await fetch(url);
      return await response.arrayBuffer();
    }
    // Fallback/standard image fetch
    const response = await fetch(url);
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Failed to fetch image buffer for docx export:', error);
    return null;
  }
}

// Convert style attributes like color or alignment
function parseTextStyle(element: HTMLElement) {
  const styles: { color?: string; bold?: boolean; italics?: boolean; underline?: {}; strike?: boolean } = {};
  
  if (element.style.color) {
    // Clean up color hex code
    const colorHex = element.style.color.replace('#', '').replace('rgb(', '').replace(')', '');
    // simple hex convert if named color or rgb
    if (colorHex.length === 6) {
      styles.color = colorHex;
    }
  }
  
  return styles;
}

export async function exportToDocx(title: string, htmlContent: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const body = doc.body;

  const children: any[] = [];

  // Recursive element parser
  async function parseElement(
    node: Node, 
    currentRuns: any[] = [], 
    styles: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; color?: string } = {},
    isList: boolean = false, 
    listType: 'bullet' | 'ordered' = 'bullet'
  ): Promise<any[]> {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim() || text === ' ') {
        currentRuns.push(new TextRun({ 
          text,
          bold: styles.bold,
          italics: styles.italics,
          underline: styles.underline ? {} : undefined,
          strike: styles.strike,
          color: styles.color,
        }));
      }
      return currentRuns;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return currentRuns;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Inline formatting tags
    if (tagName === 'strong' || tagName === 'b') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, currentRuns, { ...styles, bold: true }, isList, listType);
      }
      return currentRuns;
    }

    if (tagName === 'em' || tagName === 'i') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, currentRuns, { ...styles, italics: true }, isList, listType);
      }
      return currentRuns;
    }

    if (tagName === 'u') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, currentRuns, { ...styles, underline: true }, isList, listType);
      }
      return currentRuns;
    }

    if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, currentRuns, { ...styles, strike: true }, isList, listType);
      }
      return currentRuns;
    }

    if (tagName === 'span') {
      const textStyles = parseTextStyle(element);
      const newStyles = { ...styles };
      if (textStyles.color) {
        newStyles.color = textStyles.color;
      }
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, currentRuns, newStyles, isList, listType);
      }
      return currentRuns;
    }

    if (tagName === 'a') {
      const href = element.getAttribute('href') || '';
      const text = element.textContent || href;
      currentRuns.push(
        new ExternalHyperlink({
          children: [new TextRun({ text, color: '0563C1', underline: {} })],
          link: href,
        })
      );
      return currentRuns;
    }

    // Block level elements
    if (tagName === 'p') {
      const runs: any[] = [];
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, runs, styles);
      }
      
      let alignment: any = AlignmentType.LEFT;
      if (element.style.textAlign === 'center') alignment = AlignmentType.CENTER;
      if (element.style.textAlign === 'right') alignment = AlignmentType.RIGHT;
      if (element.style.textAlign === 'justify') alignment = AlignmentType.JUSTIFIED;

      children.push(
        new Paragraph({
          children: runs,
          alignment,
          spacing: { after: 120 }
        })
      );
      return [];
    }

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      const runs: any[] = [];
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, runs, styles);
      }
      
      let heading: any = HeadingLevel.HEADING_1;
      if (tagName === 'h2') heading = HeadingLevel.HEADING_2;
      if (tagName === 'h3') heading = HeadingLevel.HEADING_3;
      if (tagName === 'h4') heading = HeadingLevel.HEADING_4;

      children.push(
        new Paragraph({
          children: runs,
          heading,
          spacing: { before: 240, after: 120 }
        })
      );
      return [];
    }

    if (tagName === 'blockquote') {
      const runs: any[] = [];
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, runs, styles);
      }
      children.push(
        new Paragraph({
          children: runs,
          spacing: { before: 120, after: 120 },
          indent: { left: 720 },
        })
      );
      return [];
    }

    if (tagName === 'ul') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, [], styles, true, 'bullet');
      }
      return [];
    }

    if (tagName === 'ol') {
      for (const child of Array.from(element.childNodes)) {
        await parseElement(child, [], styles, true, 'ordered');
      }
      return [];
    }

    if (tagName === 'li') {
      const runs: any[] = [];
      
      // inside lists, there might be checkboxes or other content
      const checkbox = element.querySelector('input[type="checkbox"]');
      if (checkbox) {
        const checked = (checkbox as HTMLInputElement).checked;
        runs.push(new TextRun({ text: checked ? '☒ ' : '☐ ', bold: true }));
      }

      for (const child of Array.from(element.childNodes)) {
        // Skip checkbox element since we manually added it
        if (child.nodeName.toLowerCase() === 'input') continue;
        await parseElement(child, runs, styles, true, listType);
      }

      children.push(
        new Paragraph({
          children: runs,
          bullet: listType === 'bullet' ? { level: 0 } : undefined,
          numbering: listType === 'ordered' ? { reference: 'ordered-list', level: 0 } : undefined,
          spacing: { after: 60 }
        })
      );
      return [];
    }

    if (tagName === 'hr') {
      children.push(
        new Paragraph({
          border: {
            bottom: {
              color: 'CBD5E1',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 240, after: 240 }
        })
      );
      return [];
    }

    if (tagName === 'table') {
      const rows: DocxTableRow[] = [];
      const trElements = Array.from(element.querySelectorAll('tr'));
      
      for (const tr of trElements) {
        const cells: DocxTableCell[] = [];
        const cellElements = Array.from(tr.childNodes).filter(
          n => n.nodeType === Node.ELEMENT_NODE && (n.nodeName.toLowerCase() === 'td' || n.nodeName.toLowerCase() === 'th')
        ) as HTMLElement[];

        for (const cell of cellElements) {
          const cellRuns: any[] = [];
          
          // Background color for cells
          let shadingColor = undefined;
          if (cell.style.backgroundColor) {
            const rgbMatch = cell.style.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
              const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
              const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
              shadingColor = `${r}${g}${b}`;
            } else if (cell.style.backgroundColor.startsWith('#')) {
              shadingColor = cell.style.backgroundColor.replace('#', '');
            }
          }

          // Parse children inside cell
          for (const childNode of Array.from(cell.childNodes)) {
            // Note: cell element children can be text or other tags
            const subRuns: any[] = [];
            await parseElement(childNode, subRuns, styles);
            if (subRuns.length > 0) {
              cellRuns.push(...subRuns);
            }
          }

          // Make sure we have a paragraph for cell content
          const cellParagraphs = [];
          if (cellRuns.length > 0) {
            cellParagraphs.push(new Paragraph({ children: cellRuns }));
          } else {
            cellParagraphs.push(new Paragraph({ text: '' }));
          }

          cells.push(
            new DocxTableCell({
              children: cellParagraphs,
              width: {
                size: 100 / cellElements.length,
                type: WidthType.PERCENTAGE,
              },
              shading: shadingColor ? { fill: shadingColor } : undefined,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              },
              margins: {
                top: 100,
                bottom: 100,
                left: 150,
                right: 150,
              }
            })
          );
        }

        if (cells.length > 0) {
          rows.push(new DocxTableRow({ children: cells }));
        }
      }

      if (rows.length > 0) {
        children.push(
          new DocxTable({
            rows: rows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
          })
        );
      }
      return [];
    }

    if (tagName === 'img') {
      const src = element.getAttribute('src') || '';
      if (src) {
        const imageBuffer = await fetchImageBuffer(src);
        if (imageBuffer) {
          // Estimate size from element or default
          let width = 450;
          let height = 300;
          const elementWidth = element.getAttribute('width') || element.style.width;
          const elementHeight = element.getAttribute('height') || element.style.height;
          
          if (elementWidth) width = parseInt(elementWidth);
          if (elementHeight) height = parseInt(elementHeight);

          // Bound image dimensions to fit within doc margins
          if (width > 600) {
            height = (600 / width) * height;
            width = 600;
          }

          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: width,
                    height: height,
                  },
                } as any),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 }
            })
          );
        }
      }
      return [];
    }

    // Default container parsing
    for (const child of Array.from(element.childNodes)) {
      await parseElement(child, currentRuns, styles, isList, listType);
    }

    return currentRuns;
  }

  // Parse all top-level body nodes
  for (const child of Array.from(body.childNodes)) {
    await parseElement(child);
  }

  // Fallback if empty
  if (children.length === 0) {
    children.push(new Paragraph({ text: 'NovaDocs workspace document.' }));
  }

  const docx = new DocxDocument({
    numbering: {
      config: [
        {
          reference: 'ordered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate blob and download
  const blob = await Packer.toBlob(docx);
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '_')}.docx`);
}
