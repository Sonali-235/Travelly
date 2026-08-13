import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { Destination, GeneratedItinerary, PlanTier } from "./types";

const PAGE_WIDTH = 595; // A4 in points
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

interface WriterState {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
}

// pdf-lib's built-in fonts only support WinAnsi encoding, which has no
// Rupee symbol — every price in this app uses ₹, so this would otherwise
// crash on literally every PDF. Substituting rather than embedding a custom
// font keeps this dependency-free and reliable on Vercel's serverless build.
function sanitizeForPdf(text: string): string {
  const withKnownSwaps = text.replace(/₹/g, "Rs. ");
  // Safety net for anything else outside WinAnsi's range (emoji, other
  // scripts, unusual symbols an AI response could contain unpredictably) —
  // strip rather than crash the whole PDF.
  return withKnownSwaps.replace(/[^\x00-\xFF]/g, "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitizeForPdf(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function newPage(state: WriterState) {
  state.page = state.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  state.y = PAGE_HEIGHT - MARGIN;
}

async function ensureSpace(state: WriterState, needed: number) {
  if (state.y - needed < MARGIN) {
    await newPage(state);
  }
}

async function writeText(
  state: WriterState,
  text: string,
  { size = 10, bold = false, color = rgb(0.07, 0.09, 0.15), gap = 14 } = {}
) {
  const font = bold ? state.bold : state.font;
  const lines = wrapText(text, font, size, CONTENT_WIDTH);
  for (const line of lines) {
    await ensureSpace(state, gap);
    state.page.drawText(line, { x: MARGIN, y: state.y, size, font, color });
    state.y -= gap;
  }
}

async function writeSpacer(state: WriterState, amount = 10) {
  state.y -= amount;
}

export async function buildItineraryPdf(
  destination: Destination,
  itinerary: GeneratedItinerary,
  plan: PlanTier,
  travelerName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const state: WriterState = { doc, page, y: PAGE_HEIGHT - MARGIN, font, bold };

  const brand = rgb(0.145, 0.388, 0.922);
  const verified = rgb(0.086, 0.639, 0.29);
  const muted = rgb(0.42, 0.45, 0.5);

  await writeText(state, "Travelly", { size: 20, bold: true, color: brand, gap: 26 });
  await writeText(state, `${destination.name}, ${destination.state}`, { size: 14, bold: true, gap: 20 });
  await writeText(state, `${plan === "plus" ? "Travelly Plus" : "Explorer"} plan — for ${travelerName}`, {
    size: 9,
    color: muted,
    gap: 18,
  });
  await writeSpacer(state, 8);

  await writeText(state, "Trip overview", { size: 12, bold: true, gap: 16 });
  await writeText(state, itinerary.tripOverview, { size: 10, gap: 13 });
  await writeSpacer(state, 10);

  for (const day of itinerary.days) {
    await ensureSpace(state, 20);
    await writeText(state, `Day ${day.day}: ${day.title}`, { size: 12, bold: true, gap: 16 });
    await writeText(state, `Morning: ${day.morning}`, { size: 10, gap: 13 });
    await writeText(state, `Afternoon: ${day.afternoon}`, { size: 10, gap: 13 });
    await writeText(state, `Evening: ${day.evening}`, { size: 10, gap: 13 });
    await writeSpacer(state, 8);
  }

  await writeText(state, "Estimated budget (AI estimate, not verified pricing)", { size: 12, bold: true, gap: 16 });
  for (const b of itinerary.estimatedBudget) {
    await writeText(state, `${b.category}: ${b.amount}`, { size: 10, gap: 13 });
  }
  await writeSpacer(state, 10);

  await writeText(state, "Packing checklist", { size: 12, bold: true, gap: 16 });
  await writeText(state, itinerary.packingChecklist.join(", "), { size: 10, gap: 13 });
  await writeSpacer(state, 10);

  await writeText(state, "Travel tips", { size: 12, bold: true, gap: 16 });
  for (const t of itinerary.travelTips) {
    await writeText(state, `• ${t}`, { size: 10, gap: 13 });
  }

  if (plan === "plus") {
    await writeSpacer(state, 14);
    await writeText(state, "Verified information", { size: 12, bold: true, color: verified, gap: 16 });

    if (destination.verified.hotels.length > 0) {
      await writeText(state, "Hotels", { size: 10, bold: true, gap: 13 });
      for (const h of destination.verified.hotels) {
        await writeText(state, `${h.name} (${h.category}) — ${h.pricePerNight} — ${h.contact}`, {
          size: 9,
          gap: 12,
        });
      }
    }

    if (destination.verified.attractions.length > 0) {
      await writeSpacer(state, 6);
      await writeText(state, "Attractions & entry fees", { size: 10, bold: true, gap: 13 });
      for (const a of destination.verified.attractions) {
        await writeText(state, `${a.name} — ${a.entryFee} — ${a.openingHours}`, { size: 9, gap: 12 });
      }
    }

    if (destination.verified.emergencyContacts.length > 0) {
      await writeSpacer(state, 6);
      await writeText(state, "Emergency contacts", { size: 10, bold: true, gap: 13 });
      for (const c of destination.verified.emergencyContacts) {
        await writeText(state, `${c.label}: ${c.number}`, { size: 9, gap: 12 });
      }
    }
  }

  return doc.save();
}
