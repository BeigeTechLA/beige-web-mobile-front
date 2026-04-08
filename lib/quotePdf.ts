import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { SalesQuoteDetailData } from "@/lib/api";
import {
  formatQuoteCurrency,
  formatQuoteDate,
  getQuoteNumber,
  getQuoteDisplayShootTypeLabel,
  getQuoteText,
  normalizeQuoteLineItems,
  normalizeQuoteTerms,
  type NormalizedQuoteLineItem,
} from "@/lib/quoteDetail";
import { getDefaultQuoteTerms } from "@/lib/quoteTerms";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN_X = 44;
const PAGE_MARGIN_TOP = 44;
const PAGE_MARGIN_BOTTOM = 44;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;

const COLORS = {
  beige: rgb(0.91, 0.82, 0.67),
  black: rgb(0.09, 0.09, 0.1),
  white: rgb(1, 1, 1),
  panel: rgb(0.95, 0.95, 0.95),
  muted: rgb(0.45, 0.45, 0.49),
  lightBorder: rgb(0.86, 0.86, 0.88),
};

const COMPANY_PROFILE = {
  name: "Beige AI",
  subtitle: "",
  addressLines: ["9200 Sunset Blvd. #215", "West Hollywood, CA 90069"],
  email: "sales@beigecorporation.io",
  phone: "323-826-7230",
};

const sanitizePdfFileName = (value: string) =>
  value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const formatCount = (value: number) => String(Math.max(0, value)).padStart(2, "0");

const formatDuration = (value: number) => {
  if (value <= 0) {
    return "-";
  }

  return `${value} ${value === 1 ? "Hour" : "Hours"}`;
};

const breakLongWord = (value: string, font: PDFFont, size: number, maxWidth: number) => {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    const nextValue = current + char;
    if (font.widthOfTextAtSize(nextValue, size) <= maxWidth || current.length === 0) {
      current = nextValue;
      continue;
    }

    parts.push(current);
    current = char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
};

const wrapText = (value: string, font: PDFFont, size: number, maxWidth: number) => {
  const paragraphs = value.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      if (paragraphIndex < paragraphs.length - 1) {
        lines.push("");
      }
      return;
    }

    const words = trimmedParagraph.split(/\s+/);
    let currentLine = "";

    words.forEach((word) => {
      const segments =
        font.widthOfTextAtSize(word, size) > maxWidth
          ? breakLongWord(word, font, size, maxWidth)
          : [word];

      segments.forEach((segment) => {
        const nextLine = currentLine ? `${currentLine} ${segment}` : segment;
        if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
          currentLine = nextLine;
          return;
        }

        if (currentLine) {
          lines.push(currentLine);
        }

        currentLine = segment;
      });
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return lines.length > 0 ? lines : [""];
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const downloadQuotePdf = async (quote: SalesQuoteDetailData, quoteId?: string | null) => {
  const pdfBytes = await buildQuotePdf(quote, quoteId);
  const quoteData = unwrapSalesQuoteDetail(quote);
  const resolvedQuoteId = String(
    quoteData?.sales_quote_id ?? quoteData?.quote_id ?? quoteData?.id ?? quoteId ?? ""
  );
  const quoteNumber =
    getQuoteText(quoteData?.quote_number) ||
    (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");
  const safeName = sanitizePdfFileName(quoteNumber) || "quote";

  downloadBlob(new Blob([pdfBytes], { type: "application/pdf" }), `${safeName}.pdf`);
};

const buildQuotePdf = async (quote: SalesQuoteDetailData, quoteId?: string | null) => {
  const quoteData = unwrapSalesQuoteDetail(quote);

  if (!quoteData) {
    throw new Error("Quote preview data is unavailable");
  }

  const lineItems = normalizeQuoteLineItems(quoteData);
  const serviceItems = lineItems.filter((item) => item.section === "service");
  const addonItems = lineItems.filter((item) => item.section === "addon");
  const logisticsItems = lineItems.filter((item) => item.section === "logistics");
  const customItems = lineItems.filter((item) => item.section === "custom");
  const lineItemsSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const subtotal = getQuoteNumber(quoteData.subtotal) ?? lineItemsSubtotal;
  const taxRate = getQuoteNumber(quoteData.tax_rate) ?? 0;
  const taxType = getQuoteText(quoteData.tax_type, "Sales Tax") || "Sales Tax";
  const taxAmount =
    getQuoteNumber(quoteData.tax_amount, quoteData.sales_tax) ?? subtotal * (taxRate / 100);
  const amountAfterTax =
    getQuoteNumber(quoteData.amount_after_tax, quoteData.total_after_tax) ?? subtotal + taxAmount;
  const discountValue = getQuoteNumber(quoteData.discount_value) ?? 0;
  const discountType = getQuoteText(quoteData.discount_type).toLowerCase();
  const discountAmount =
    getQuoteNumber(quoteData.discount_amount) ??
    (discountType.includes("percent") ? amountAfterTax * (discountValue / 100) : discountValue);
  const finalTotal =
    getQuoteNumber(
      quoteData.final_total,
      quoteData.total_amount,
      quoteData.total,
      quoteData.amount_after_discount
    ) ?? Math.max(amountAfterTax - discountAmount, 0);

  const resolvedQuoteId = String(
    quoteData.sales_quote_id ?? quoteData.quote_id ?? quoteData.id ?? quoteId ?? ""
  );
  const quoteNumber =
    getQuoteText(quoteData.quote_number) || (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");
  const clientName = getQuoteText(quoteData.client_name, "Client");
  const clientEmail = getQuoteText(quoteData.client_email, quoteData.guest_email, "N/A") || "N/A";
  const clientPhone = getQuoteText(quoteData.client_phone, "N/A") || "N/A";
  const clientAddress =
    getQuoteText(
      quoteData.client_address,
      quoteData.address,
      quoteData.location,
      "Address not available"
    ) || "Address not available";
  const projectDescription =
    getQuoteText(quoteData.project_description, "Project description not available") ||
    "Project description not available";
  const shootTypeLabel = getQuoteDisplayShootTypeLabel(quoteData);
  const terms = normalizeQuoteTerms(
    quoteData.terms_conditions,
    getDefaultQuoteTerms(getQuoteText(quoteData.valid_until, quoteData.expires_at) || null)
  );
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - PAGE_MARGIN_TOP;

  const drawText = (
    currentPage: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = COLORS.black
  ) => {
    currentPage.drawText(text, {
      x,
      y,
      size,
      font,
      color,
    });
  };

  const drawRightAlignedText = (
    currentPage: PDFPage,
    text: string,
    rightX: number,
    y: number,
    size: number,
    font: PDFFont,
    color = COLORS.black
  ) => {
    drawText(
      currentPage,
      text,
      rightX - font.widthOfTextAtSize(text, size),
      y,
      size,
      font,
      color
    );
  };

  const drawDivider = () => {
    page.drawLine({
      start: { x: PAGE_MARGIN_X, y: cursorY },
      end: { x: PAGE_WIDTH - PAGE_MARGIN_X, y: cursorY },
      color: COLORS.lightBorder,
      thickness: 1,
    });
    cursorY -= 18;
  };

  const startNewPage = (sectionLabel?: string) => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = PAGE_HEIGHT - PAGE_MARGIN_TOP;

    drawText(page, quoteNumber, PAGE_MARGIN_X, cursorY, 10, boldFont, COLORS.muted);
    drawRightAlignedText(
      page,
      formatQuoteDate(quoteData.created_at),
      PAGE_WIDTH - PAGE_MARGIN_X,
      cursorY,
      10,
      regularFont,
      COLORS.muted
    );
    cursorY -= 12;
    drawDivider();

    if (sectionLabel) {
      drawText(page, sectionLabel.toUpperCase(), PAGE_MARGIN_X, cursorY, 11, boldFont, COLORS.muted);
      cursorY -= 20;
    }
  };

  const ensureSpace = (requiredHeight: number, sectionLabel?: string) => {
    if (cursorY - requiredHeight >= PAGE_MARGIN_BOTTOM) {
      return;
    }

    startNewPage(sectionLabel);
  };

  const drawWrappedBlock = (
    text: string,
    options: {
      x: number;
      y: number;
      width: number;
      size: number;
      font: PDFFont;
      color?: ReturnType<typeof rgb>;
      lineHeight?: number;
    }
  ) => {
    const lines = wrapText(text, options.font, options.size, options.width);
    const lineHeight = options.lineHeight ?? options.size * 1.4;

    lines.forEach((line, index) => {
      drawText(
        page,
        line,
        options.x,
        options.y - index * lineHeight,
        options.size,
        options.font,
        options.color ?? COLORS.black
      );
    });

    return {
      lines,
      height: lines.length * lineHeight,
    };
  };

  const drawSectionLabel = (value: string) => {
    ensureSpace(20, value);
    drawText(page, value.toUpperCase(), PAGE_MARGIN_X, cursorY, 10, boldFont, COLORS.muted);
    cursorY -= 18;
  };

  const drawAmountSection = (title: string, items: NormalizedQuoteLineItem[]) => {
    if (items.length === 0) {
      return;
    }

    drawSectionLabel(title);

    items.forEach((item) => {
      const amountText = formatQuoteCurrency(item.amount);
      const amountWidth = boldFont.widthOfTextAtSize(amountText, 11);
      const nameWidth = CONTENT_WIDTH - amountWidth - 18;
      const nameLines = wrapText(item.name, regularFont, 11, nameWidth);
      const rowHeight = Math.max(nameLines.length * 15, 16) + 6;

      ensureSpace(rowHeight + 4, title);

      nameLines.forEach((line, lineIndex) => {
        drawText(page, line, PAGE_MARGIN_X, cursorY - lineIndex * 15, 11, regularFont, COLORS.black);
      });
      drawRightAlignedText(
        page,
        amountText,
        PAGE_WIDTH - PAGE_MARGIN_X,
        cursorY,
        11,
        boldFont,
        COLORS.black
      );

      cursorY -= rowHeight;
    });

    cursorY -= 6;
  };

  ensureSpace(118);
  drawText(page, COMPANY_PROFILE.name, PAGE_MARGIN_X, cursorY, 20, boldFont, COLORS.black);
  if (COMPANY_PROFILE.subtitle) {
    drawText(page, COMPANY_PROFILE.subtitle, PAGE_MARGIN_X, cursorY - 18, 11, regularFont, COLORS.muted);
  }

  let companyInfoY = COMPANY_PROFILE.subtitle ? cursorY - 40 : cursorY - 22;
  COMPANY_PROFILE.addressLines.forEach((line) => {
    drawText(page, line, PAGE_MARGIN_X, companyInfoY, 10.5, regularFont, COLORS.muted);
    companyInfoY -= 14;
  });
  drawText(
    page,
    `${COMPANY_PROFILE.email} ${COMPANY_PROFILE.phone}`,
    PAGE_MARGIN_X,
    companyInfoY,
    10.5,
    regularFont,
    COLORS.muted
  );

  drawRightAlignedText(
    page,
    "PROPOSAL",
    PAGE_WIDTH - PAGE_MARGIN_X,
    cursorY,
    28,
    boldFont,
    COLORS.black
  );

  const metaRightX = PAGE_WIDTH - PAGE_MARGIN_X;
  const metaTopY = cursorY - 28;
  drawRightAlignedText(page, `Quote #: ${quoteNumber}`, metaRightX, metaTopY, 11, boldFont, COLORS.black);
  drawRightAlignedText(
    page,
    `Date: ${formatQuoteDate(quoteData.created_at)}`,
    metaRightX,
    metaTopY - 16,
    10.5,
    regularFont,
    COLORS.muted
  );
  drawRightAlignedText(
    page,
    `Valid Until: ${formatQuoteDate(quoteData.valid_until ?? quoteData.expires_at)}`,
    metaRightX,
    metaTopY - 32,
    10.5,
    regularFont,
    COLORS.muted
  );

  cursorY -= 98;
  drawDivider();

  drawSectionLabel("Bill To");
  drawText(page, clientName, PAGE_MARGIN_X, cursorY, 18, boldFont, COLORS.black);
  cursorY -= 20;
  const billToText = [clientAddress, clientEmail, clientPhone].filter(Boolean).join("\n");
  const billToBlock = drawWrappedBlock(billToText, {
    x: PAGE_MARGIN_X,
    y: cursorY,
    width: CONTENT_WIDTH,
    size: 10.5,
    font: regularFont,
    color: COLORS.muted,
    lineHeight: 14,
  });
  cursorY -= billToBlock.height + 14;

  const descriptionLines = wrapText(projectDescription, regularFont, 10.5, CONTENT_WIDTH - 24);
  const descriptionHeight = descriptionLines.length * 15 + 28;
  ensureSpace(descriptionHeight + 12, "Project Description");

  page.drawRectangle({
    x: PAGE_MARGIN_X,
    y: cursorY - descriptionHeight + 8,
    width: CONTENT_WIDTH,
    height: descriptionHeight,
    color: COLORS.panel,
  });
  drawText(page, "PROJECT DESCRIPTION", PAGE_MARGIN_X + 12, cursorY - 12, 10, boldFont, COLORS.muted);
  drawWrappedBlock(projectDescription, {
    x: PAGE_MARGIN_X + 12,
    y: cursorY - 30,
    width: CONTENT_WIDTH - 24,
    size: 10.5,
    font: regularFont,
    color: COLORS.black,
    lineHeight: 15,
  });
  cursorY -= descriptionHeight + 16;

  if (serviceItems.length > 0) {
    const drawServiceTableHeader = () => {
      ensureSpace(26, "Services");
      drawText(page, "SERVICES", PAGE_MARGIN_X, cursorY, 10, boldFont, COLORS.muted);
      cursorY -= 18;
      drawText(page, "Description", PAGE_MARGIN_X, cursorY, 10.5, boldFont, COLORS.black);
      drawText(page, "Qty", PAGE_MARGIN_X + 298, cursorY, 10.5, boldFont, COLORS.black);
      drawText(page, "Duration", PAGE_MARGIN_X + 338, cursorY, 10.5, boldFont, COLORS.black);
      drawText(page, "Crew", PAGE_MARGIN_X + 412, cursorY, 10.5, boldFont, COLORS.black);
      drawRightAlignedText(page, "Amount", PAGE_WIDTH - PAGE_MARGIN_X, cursorY, 10.5, boldFont, COLORS.black);
      cursorY -= 10;
      drawDivider();
    };

    drawServiceTableHeader();

    serviceItems.forEach((item) => {
      const detailLabel = item.subtitle || (shootTypeLabel ? `(${shootTypeLabel})` : "");
      const description = detailLabel ? `${item.name} - ${detailLabel}` : item.name;
      const serviceLines = wrapText(description, regularFont, 10.5, 280);
      const rowHeight = Math.max(serviceLines.length * 14, 18) + 8;

      if (cursorY - rowHeight < PAGE_MARGIN_BOTTOM) {
        startNewPage("Services");
        drawServiceTableHeader();
      }

      serviceLines.forEach((line, lineIndex) => {
        drawText(page, line, PAGE_MARGIN_X, cursorY - lineIndex * 14, 10.5, regularFont, COLORS.black);
      });
      drawText(page, formatCount(item.quantity), PAGE_MARGIN_X + 302, cursorY, 10.5, regularFont);
      drawText(page, formatDuration(item.duration), PAGE_MARGIN_X + 338, cursorY, 10.5, regularFont);
      drawText(
        page,
        item.crew > 0 ? formatCount(item.crew) : "-",
        PAGE_MARGIN_X + 418,
        cursorY,
        10.5,
        regularFont
      );
      drawRightAlignedText(
        page,
        formatQuoteCurrency(item.amount),
        PAGE_WIDTH - PAGE_MARGIN_X,
        cursorY,
        10.5,
        boldFont,
        COLORS.black
      );

      cursorY -= rowHeight;
    });

    cursorY -= 10;
  }

  drawAmountSection("Add-ons", addonItems);
  drawAmountSection("Logistics", logisticsItems);
  drawAmountSection("Custom Items", customItems);

  const summaryBoxHeight = discountAmount > 0 ? 116 : 94;
  ensureSpace(summaryBoxHeight + 18, "Summary");

  page.drawRectangle({
    x: PAGE_MARGIN_X,
    y: cursorY - summaryBoxHeight + 8,
    width: CONTENT_WIDTH,
    height: summaryBoxHeight,
    color: COLORS.beige,
  });

  let summaryY = cursorY - 18;
  const drawSummaryRow = (label: string, value: string) => {
    drawText(page, label, PAGE_MARGIN_X + 14, summaryY, 11, regularFont, COLORS.black);
    drawRightAlignedText(
      page,
      value,
      PAGE_WIDTH - PAGE_MARGIN_X - 14,
      summaryY,
      11,
      boldFont,
      COLORS.black
    );
    summaryY -= 18;
  };

  drawSummaryRow("Subtotal", formatQuoteCurrency(subtotal));
  drawSummaryRow(`${taxType} (${taxRate}%)`, formatQuoteCurrency(taxAmount));
  if (discountAmount > 0) {
    drawSummaryRow("Discount Applied", `-${formatQuoteCurrency(discountAmount)}`);
  }

  page.drawRectangle({
    x: PAGE_MARGIN_X + 12,
    y: cursorY - summaryBoxHeight + 20,
    width: CONTENT_WIDTH - 24,
    height: 38,
    color: COLORS.black,
  });

  drawText(page, "Total", PAGE_MARGIN_X + 24, cursorY - summaryBoxHeight + 34, 18, boldFont, COLORS.white);
  drawRightAlignedText(
    page,
    formatQuoteCurrency(finalTotal),
    PAGE_WIDTH - PAGE_MARGIN_X - 24,
    cursorY - summaryBoxHeight + 34,
    18,
    boldFont,
    COLORS.beige
  );

  cursorY -= summaryBoxHeight + 16;

  if (terms.length > 0) {
    drawSectionLabel("Terms & Conditions");

    terms.forEach((term) => {
      const bulletText = `- ${term}`;
      const termLines = wrapText(bulletText, regularFont, 10.5, CONTENT_WIDTH - 8);
      const blockHeight = termLines.length * 14 + 4;
      ensureSpace(blockHeight + 2, "Terms & Conditions");

      termLines.forEach((line, lineIndex) => {
        drawText(page, line, PAGE_MARGIN_X, cursorY - lineIndex * 14, 10.5, regularFont, COLORS.muted);
      });

      cursorY -= blockHeight;
    });
  }

  ensureSpace(34, "Contact");
  drawDivider();
  const footerText =
    "Thank you for your business. For questions, contact Beige AI at sales@beigecorporation.io or 323-826-7230";
  const footerBlock = drawWrappedBlock(footerText, {
    x: PAGE_MARGIN_X,
    y: cursorY,
    width: CONTENT_WIDTH,
    size: 10.5,
    font: regularFont,
    color: COLORS.muted,
    lineHeight: 14,
  });
  cursorY -= footerBlock.height;

  const pages = pdfDoc.getPages();
  pages.forEach((currentPage, index) => {
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    const labelWidth = regularFont.widthOfTextAtSize(pageLabel, 9);
    drawText(
      currentPage,
      pageLabel,
      PAGE_WIDTH - PAGE_MARGIN_X - labelWidth,
      20,
      9,
      regularFont,
      COLORS.muted
    );
  });

  return pdfDoc.save();
};
