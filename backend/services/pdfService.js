const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (bill) => {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, '../uploads/invoices');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `Invoice-${bill.billNumber}.pdf`;
    const filepath = path.join(dir, filename);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // ─── HEADER ───
    doc.rect(0, 0, 612, 100).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text(process.env.STORE_NAME || 'D-Mart Smart Supermarket', 50, 25, { align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
      .text(process.env.STORE_ADDRESS || '123 Market Road, Mumbai', 50, 52)
      .text(`Phone: ${process.env.STORE_PHONE || '+91-9876543210'} | Email: ${process.env.STORE_EMAIL || 'billing@dmart.com'}`, 50, 65)
      .text(`GSTIN: ${process.env.STORE_GSTIN || '27AAAAA0000A1Z5'}`, 50, 78);

    doc.fillColor('#10b981').fontSize(16).font('Helvetica-Bold')
      .text('TAX INVOICE', 430, 35, { align: 'right' });
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica')
      .text(`Invoice #: ${bill.billNumber}`, 430, 57, { align: 'right' })
      .text(`Date: ${new Date(bill.createdAt).toLocaleString('en-IN')}`, 430, 70, { align: 'right' });

    // ─── BILL INFO ───
    doc.fillColor('#0f172a');
    let y = 120;
    doc.roundedRect(50, y, 240, 70, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('BILLED TO:', 60, y + 10);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold')
      .text(bill.customer?.name || 'Walk-in Customer', 60, y + 24);
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
      .text(`Phone: ${bill.customer?.phone || '-'}`, 60, y + 40)
      .text(`Email: ${bill.customer?.email || '-'}`, 60, y + 54);

    doc.roundedRect(310, y, 240, 70, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('PAYMENT INFO:', 320, y + 10);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold')
      .text(bill.paymentMethod?.toUpperCase() || 'CASH', 320, y + 24);
    const statusColor = bill.paymentStatus === 'paid' ? '#10b981' : '#ef4444';
    doc.roundedRect(320, y + 40, 60, 18, 3).fill(statusColor);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      .text(bill.paymentStatus?.toUpperCase(), 325, y + 45);
    if (bill.razorpayPaymentId) {
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text(`Txn: ${bill.razorpayPaymentId}`, 320, y + 62);
    }

    // ─── ITEMS TABLE ───
    y = 215;
    const headers = ['#', 'Product', 'Qty', 'Rate (₹)', 'GST%', 'Disc%', 'Total (₹)'];
    const colWidths = [25, 180, 35, 70, 40, 40, 80];
    const colX = [50];
    colWidths.forEach((w, i) => colX.push(colX[i] + w));

    // Table header
    doc.rect(50, y, 512, 22).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      const align = i > 1 ? 'center' : 'left';
      doc.text(h, colX[i] + 2, y + 7, { width: colWidths[i] - 4, align });
    });

    y += 22;
    bill.items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(50, y, 512, 20).fill(rowColor);
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica');
      const row = [
        String(index + 1),
        item.name,
        String(item.quantity),
        item.sellingPrice.toFixed(2),
        `${item.gstPercent}%`,
        `${item.discountPercent}%`,
        item.totalPrice.toFixed(2),
      ];
      row.forEach((cell, i) => {
        const align = i > 1 ? 'center' : 'left';
        doc.text(cell, colX[i] + 2, y + 6, { width: colWidths[i] - 4, align });
      });
      doc.rect(50, y, 512, 20).stroke('#e2e8f0');
      y += 20;
    });

    // ─── TOTALS ───
    y += 15;
    const totalsX = 350;
    const totalsWidth = 212;
    const addTotalRow = (label, value, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(totalsX, y, totalsWidth, 24).fill('#0f172a');
        doc.fillColor('#10b981').fontSize(12).font('Helvetica-Bold')
          .text(label, totalsX + 10, y + 6, { width: 100 })
          .text(`₹${value}`, totalsX + 110, y + 6, { width: 90, align: 'right' });
      } else {
        doc.rect(totalsX, y, totalsWidth, 20).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor(bold ? '#1e293b' : '#475569').fontSize(9)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, totalsX + 10, y + 6, { width: 100 })
          .text(`₹${value}`, totalsX + 110, y + 6, { width: 90, align: 'right' });
      }
      y += highlight ? 24 : 20;
    };

    addTotalRow('Subtotal:', bill.subtotal.toFixed(2));
    addTotalRow('GST:', bill.totalGST.toFixed(2));
    addTotalRow('Discount:', `-${bill.totalDiscount.toFixed(2)}`);
    addTotalRow('GRAND TOTAL:', bill.grandTotal.toFixed(2), false, true);

    // ─── FOOTER ───
    y += 20;
    doc.moveTo(50, y).lineTo(562, y).stroke('#e2e8f0');
    y += 15;
    doc.fillColor('#64748b').fontSize(8).font('Helvetica')
      .text('Thank you for shopping at ' + (process.env.STORE_NAME || 'D-Mart Smart Supermarket') + '!', 50, y, { align: 'center', width: 512 })
      .text('This is a computer-generated invoice and does not require a signature.', 50, y + 14, { align: 'center', width: 512 })
      .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, y + 28, { align: 'center', width: 512 });

    doc.end();
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
};

module.exports = { generateInvoicePDF };
