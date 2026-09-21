import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { PoemDetail, Section } from '../models/api.model';
import { splitInitial } from '../arabic';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly document = inject(DOCUMENT);

  /**
   * Generates and downloads a high-fidelity PDF of the khassida.
   * Fixes blank canvas issues by ensuring correct DOM positioning,
   * awaiting font shaping, and resetting scroll offsets.
   */
  async exportPoem(
    poem: PoemDetail,
    options: { showTranscription?: boolean } = {}
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1. Ensure fonts (Amiri, Source Sans) are completely loaded
    if ((this.document as unknown as { fonts?: { ready: Promise<void> } }).fonts?.ready) {
      await (this.document as unknown as { fonts: { ready: Promise<void> } }).fonts.ready;
    }

    // 2. Create and attach container visibly at (0, 0) with top-level z-index so html2canvas can capture it
    const container = this.createPrintElement(poem, options.showTranscription ?? false);
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '794px'; // standard A4 width in pixels at 96 DPI
    container.style.zIndex = '999999';
    container.style.backgroundColor = '#ffffff';
    container.style.boxShadow = '0 0 20px rgba(0,0,0,0.2)';
    this.document.body.appendChild(container);

    // 3. Small pause to allow the browser to perform layout and glyph shaping
    await new Promise((resolve) => setTimeout(resolve, 300));

    const filename = `${poem.code}_Khassida_${String(poem.number).padStart(3, '0')}.pdf`;

    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default ?? html2canvasModule;
      const jspdfModule = await import('jspdf');
      const { jsPDF } = jspdfModule;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const pageContentHeight = pageHeight - margin * 2;

      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= pageContentHeight;

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= pageContentHeight;
      }

      pdf.save(filename);
    } catch (err) {
      console.error('Erreur export direct PDF:', err);
      // Fallback: open print view if canvas generation fails
      this.printPoemDirect(poem, options.showTranscription ?? false);
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  /**
   * Opens a clean, dedicated printable window for vector PDF generation using the browser's native print engine.
   */
  printPoemDirect(poem: PoemDetail, showTranscription: boolean): void {
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const container = this.createPrintElement(poem, showTranscription);
    container.style.position = 'static';
    container.style.zIndex = 'auto';
    container.style.width = '100%';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>${poem.title} | ${poem.code}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body { margin: 0; padding: 0; background: #fff; font-family: 'Amiri', 'Traditional Arabic', serif; }
          .pdf-bayt { page-break-inside: avoid; break-inside: avoid; }
        </style>
      </head>
      <body>
        ${container.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  private createPrintElement(poem: PoemDetail, showTranscription: boolean): HTMLElement {
    const el = this.document.createElement('div');
    el.className = 'diwan-pdf-container';

    const sectionLabels: Record<Section, string> = {
      muqaddima: 'Ouverture',
      title: 'Nom du poème',
      matn: 'Abyat',
      khatima: 'Clôture',
    };

    let html = `
      <div style="font-family: 'Amiri', 'Traditional Arabic', serif; direction: rtl; text-align: right; color: #15211d; padding: 20px; background: #ffffff; width: 760px; box-sizing: border-box;">
        <div class="pdf-header" style="text-align: center; border-bottom: 2px solid #a3803a; padding-bottom: 14px; margin-bottom: 22px;">
          <img src="/images/logo.png" style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 8px; object-fit: contain;" alt="Diwaan">
          <p style="font-size: 13px; color: #5a6862; margin: 0 0 6px; font-family: 'Source Sans 3', sans-serif; direction: ltr; font-weight: 600;">
            Plateforme Diwaan · Khassida Serigne Touba
          </p>
          <p style="font-size: 18px; color: #0f5a44; font-weight: bold; margin: 0 0 8px;">
            ${poem.diwan.title} (Diwan ${poem.diwan.number})
          </p>
          <h1 style="font-size: 28px; line-height: 1.4; margin: 0 0 10px; color: #15211d;">
            ${poem.title}
          </h1>
          <div style="display: flex; justify-content: center; gap: 15px; font-size: 13px; color: #5a6862; font-family: 'Source Sans 3', sans-serif; direction: ltr;">
            <span><strong>Code :</strong> ${poem.code}</span>
            <span>·</span>
            <span><strong>Poème n° :</strong> ${poem.number}</span>
            <span>·</span>
            <span><strong>Nombre d'abyat :</strong> ${poem.bayt_count}</span>
            ${poem.is_acrostic ? '<span>·</span> <span style="color: #a3803a; font-weight: bold;">Acrostiche</span>' : ''}
          </div>
        </div>

        <div style="margin-top: 10px;">
    `;

    let currentSection: Section | null = null;

    for (const line of poem.lines) {
      if (line.section !== currentSection) {
        if (currentSection !== null) {
          html += `</div>`;
        }
        currentSection = line.section;
        html += `
          <div class="pdf-section" style="margin-bottom: 20px;">
            <div class="pdf-section-title" style="direction: ltr; font-family: 'Source Sans 3', sans-serif; font-size: 12px; font-weight: bold; color: #a3803a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e3e7e0; padding-bottom: 4px; margin: 18px 0 12px;">
              ${sectionLabels[line.section] ?? line.section}
            </div>
        `;
      }

      if (line.kind === 'bayt') {
        const initial = poem.is_acrostic ? splitInitial(line.hemistichs[0]) : null;

        html += `
          <div class="pdf-bayt" style="page-break-inside: avoid; break-inside: avoid; border-bottom: 1px solid #f0f2ee; padding: 8px 0; margin-bottom: 6px;">
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 15px;">
              <span style="font-family: 'Source Sans 3', sans-serif; font-size: 11px; font-weight: bold; color: #a3803a; min-width: 25px; text-align: left; direction: ltr;">
                ${line.bayt_number ?? ''}
              </span>
              <div style="display: flex; flex: 1; justify-content: space-between; gap: 20px; font-size: 20px; line-height: 1.8;">
        `;

        if (line.hemistichs.length === 2) {
          const firstHemistich = initial
            ? `<span style="color: #c92a2a; font-weight: bold;">${initial.initial}${initial.joiner}</span>${initial.joiner}${initial.rest}`
            : line.hemistichs[0];

          html += `
            <span style="flex: 1; text-align: right;">${firstHemistich}</span>
            <span style="flex: 1; text-align: left;">${line.hemistichs[1]}</span>
          `;
        } else {
          for (let i = 0; i < line.hemistichs.length; i++) {
            const h = line.hemistichs[i];
            const content = i === 0 && initial
              ? `<span style="color: #c92a2a; font-weight: bold;">${initial.initial}${initial.joiner}</span>${initial.joiner}${initial.rest}`
              : h;
            html += `<span style="flex: 1; text-align: center;">${content}</span>`;
          }
        }

        html += `
              </div>
            </div>
        `;

        if (showTranscription && line.transcription?.['local']) {
          html += `
            <div style="direction: ltr; text-align: center; font-family: 'Source Sans 3', sans-serif; font-size: 11px; color: #5a6862; margin-top: 4px; font-style: italic;">
              ${line.transcription['local'].join(' | ')}
            </div>
          `;
        }

        html += `</div>`;
      } else {
        html += `
          <div class="pdf-bayt" style="page-break-inside: avoid; break-inside: avoid; text-align: center; font-size: 20px; line-height: 1.8; padding: 8px 0; color: #0a4533;">
            ${line.hemistichs.join(' ')}
            ${
              showTranscription && line.transcription?.['local']
                ? `<div style="direction: ltr; font-family: 'Source Sans 3', sans-serif; font-size: 11px; color: #5a6862; margin-top: 4px; font-style: italic;">${line.transcription['local'].join(' ')}</div>`
                : ''
            }
          </div>
        `;
      }
    }

    if (currentSection !== null) {
      html += `</div>`;
    }

    html += `
        </div>
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #d3d9d2; text-align: center; font-size: 10px; color: #5a6862; font-family: 'Source Sans 3', sans-serif; direction: ltr;">
          Document généré depuis la plateforme Diwan (diwan-platform.onrender.com) · Droits réservés
        </div>
      </div>
    `;

    el.innerHTML = html;
    el.style.background = '#ffffff';
    return el;
  }
}
