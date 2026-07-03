interface ReportData {
  year: number;
  scopeRegion: string;
  totalSales: number;
  orderCount: number;
  monthlySales: number[]; // 12 values, Jan–Dec
  statusBreakdown: { paid: number; refunded: number; failed: number };
}

export function buildReportHtml(data: ReportData): string {
  const monthLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
  .header { border-bottom: 4px solid #5b21b6; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #5b21b6; }
  .header p { color: #666; margin-top: 6px; font-size: 14px; }
  .cards { display: flex; gap: 16px; margin-bottom: 36px; }
  .card { flex: 1; background: #f5f3ff; border-radius: 12px; padding: 20px; border: 1px solid #ddd6fe; }
  .card .label { font-size: 12px; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .value { font-size: 26px; font-weight: 700; margin-top: 8px; }
  .chart-row { display: flex; gap: 24px; margin-bottom: 36px; }
  .chart-box { flex: 1; border: 1px solid #eee; border-radius: 12px; padding: 16px; }
  .chart-box h3 { font-size: 14px; margin-bottom: 12px; color: #444; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
  th { background: #f5f3ff; color: #5b21b6; }
  .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Financial Report ${data.year}</h1>
    <p>Region: ${data.scopeRegion} &nbsp;•&nbsp; Generated ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="cards">
    <div class="card">
      <div class="label">Total Sales</div>
      <div class="value">$${data.totalSales.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Total Orders</div>
      <div class="value">${data.orderCount.toLocaleString()}</div>
    </div>
    <div class="card">
      <div class="label">Avg Order Value</div>
      <div class="value">$${(data.orderCount ? data.totalSales / data.orderCount : 0).toFixed(2)}</div>
    </div>
  </div>

  <div class="chart-row">
    <div class="chart-box">
      <h3>Monthly Sales</h3>
      <canvas id="monthlyChart"></canvas>
    </div>
    <div class="chart-box">
      <h3>Order Status</h3>
      <canvas id="statusChart"></canvas>
    </div>
  </div>

  <h3 style="margin-bottom: 8px; color:#444;">Monthly Breakdown</h3>
  <table>
    <thead><tr><th>Month</th><th>Sales</th></tr></thead>
    <tbody>
      ${data.monthlySales.map((v, i) => `<tr><td>${monthLabels[i]}</td><td>$${v.toLocaleString()}</td></tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">SaaS Analytics Platform — Confidential</div>

  <script>
    new Chart(document.getElementById('monthlyChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(monthLabels)},
        datasets: [{ label: 'Sales ($)', data: ${JSON.stringify(data.monthlySales)}, backgroundColor: '#7c3aed' }]
      },
      options: { animation: false, plugins: { legend: { display: false } } }
    });

    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Refunded', 'Failed'],
        datasets: [{
          data: [${data.statusBreakdown.paid}, ${data.statusBreakdown.refunded}, ${data.statusBreakdown.failed}],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
        }]
      },
      options: { animation: false }
    });

    // Signal to Puppeteer that charts are drawn
    window.chartsReady = true;
  </script>
</body>
</html>`;
}
