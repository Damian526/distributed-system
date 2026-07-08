import { COUNTRY_NAMES } from './fx-rates';

interface ReportData {
  year: number;
  currencySymbol: string;
  totalSales: number;
  orderCount: number;
  uniqueCustomers: number;
  refundRate: number;
  failedRate: number;
  monthlySales: number[];
  statusBreakdown: { paid: number; refunded: number; failed: number };
  currencyBreakdown: Record<string, number>;
  regionRevenue: Record<string, number>;
  topCustomers: { name: string; total: number }[];
  topProducts: { name: string; revenue: number }[];
}

export function buildReportHtml(data: ReportData): string {
  // prettier-ignore
  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // A friendly categorical palette reused across the bar charts.
  // prettier-ignore
  const PALETTE = [
    '#7c3aed', '#2563eb', '#0891b2', '#059669', '#ca8a04',
    '#dc2626', '#db2777', '#4f46e5', '#0d9488', '#ea580c',
  ];

  const sym = data.currencySymbol;
  const avgOrderValue = data.orderCount ? data.totalSales / data.orderCount : 0;
  const multiCurrency = Object.keys(data.currencyBreakdown).length > 1;

  const currencyLabels = Object.keys(data.currencyBreakdown);
  const currencyValues = Object.values(data.currencyBreakdown).map((v) =>
    Math.round(v),
  );
  const customerLabels = data.topCustomers.map((c) => c.name);
  const customerValues = data.topCustomers.map((c) => Math.round(c.total));
  const productLabels = data.topProducts.map((p) => p.name);
  const productValues = data.topProducts.map((p) => p.revenue);

  const regionSorted = Object.entries(data.regionRevenue).sort(
    (a, b) => b[1] - a[1],
  );
  const regionLabels = regionSorted.map(
    ([code]) => COUNTRY_NAMES[code] ?? code,
  );
  const regionValues = regionSorted.map(([, v]) => Math.round(v));

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
    color: #1e1b2e;
    background: #ffffff;
    padding: 36px 40px;
  }

  /* Header */
  .header { margin-bottom: 28px; }
  .header .eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #7c3aed; }
  .header h1 { font-size: 30px; font-weight: 800; color: #1e1b2e; margin-top: 4px; }
  .header .meta { color: #6b7280; margin-top: 8px; font-size: 13px; }
  .header .rule { height: 5px; width: 100%; margin-top: 16px; border-radius: 4px;
    background: linear-gradient(90deg, #7c3aed 0%, #2563eb 60%, #06b6d4 100%); }

  /* KPI cards */
  .cards { display: flex; gap: 14px; margin-bottom: 16px; }
  .card {
    flex: 1; background: #ffffff; border-radius: 14px; padding: 18px 20px;
    border: 1px solid #ece9f5; box-shadow: 0 1px 3px rgba(30,27,46,0.06);
    position: relative; overflow: hidden;
  }
  .card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #7c3aed; }
  .card.blue::before { background: #2563eb; }
  .card.cyan::before { background: #06b6d4; }
  .card.green::before { background: #22c55e; }
  .card.amber::before { background: #f59e0b; }
  .card.red::before { background: #ef4444; }
  .card .label { font-size: 11px; color: #8b8898; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .card .value { font-size: 25px; font-weight: 800; margin-top: 8px; color: #1e1b2e; }

  .fx-note {
    font-size: 12px; color: #5b21b6; background: #f5f3ff; border: 1px solid #e5deff;
    border-radius: 10px; padding: 10px 14px; margin: 16px 0 8px;
  }

  /* Panels + charts */
  .section { margin-top: 24px; page-break-inside: avoid; }
  .chart-row { display: flex; gap: 20px; margin-top: 20px; page-break-inside: avoid; }
  .panel {
    flex: 1; border: 1px solid #ece9f5; border-radius: 14px; padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(30,27,46,0.06); background: #fff; page-break-inside: avoid;
  }
  .panel h3 { font-size: 14px; font-weight: 700; color: #1e1b2e; margin-bottom: 4px; }
  .panel .sub { font-size: 11px; color: #9b98a8; margin-bottom: 10px; }
  .canvas-wrap { position: relative; width: 100%; }
  .h-tall { height: 320px; }
  .h-mid { height: 320px; }
  .h-xl { height: 460px; }
  .page-break { page-break-before: always; break-before: page; }

  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #ece9f5; text-align: center; color: #b0adbe; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">SaaS Analytics Platform</div>
    <h1>Financial Report ${data.year}</h1>
    <div class="meta">Scope: <strong>Worldwide 🌍</strong> &nbsp;•&nbsp; Reporting currency: <strong>${sym}</strong> &nbsp;•&nbsp; Generated ${new Date().toLocaleDateString()}</div>
    <div class="rule"></div>
  </div>

  <div class="cards">
    <div class="card">
      <div class="label">Total Sales</div>
      <div class="value">${sym}${data.totalSales.toLocaleString()}</div>
    </div>
    <div class="card blue">
      <div class="label">Total Orders</div>
      <div class="value">${data.orderCount.toLocaleString()}</div>
    </div>
    <div class="card cyan">
      <div class="label">Avg Order Value</div>
      <div class="value">${sym}${avgOrderValue.toFixed(2)}</div>
    </div>
  </div>

  <div class="cards">
    <div class="card green">
      <div class="label">Paying Customers</div>
      <div class="value">${data.uniqueCustomers.toLocaleString()}</div>
    </div>
    <div class="card amber">
      <div class="label">Refund Rate</div>
      <div class="value">${data.refundRate}%</div>
    </div>
    <div class="card red">
      <div class="label">Failed Payment Rate</div>
      <div class="value">${data.failedRate}%</div>
    </div>
  </div>

  ${
    multiCurrency
      ? `<p class="fx-note">💱 This is a worldwide report. All amounts are converted to ${sym} using indicative exchange rates, so totals across currencies and regions are comparable.</p>`
      : ''
  }

  <div class="chart-row">
    <div class="panel">
      <h3>📈 Monthly Sales</h3>
      <div class="sub">Revenue per month (${sym})</div>
      <div class="canvas-wrap h-tall"><canvas id="monthlyChart"></canvas></div>
    </div>
  </div>

  <div class="chart-row">
    <div class="panel">
      <h3>🌍 Revenue by Region</h3>
      <div class="sub">Share of revenue by country (in ${sym})</div>
      <div class="canvas-wrap h-mid"><canvas id="regionChart"></canvas></div>
    </div>
    <div class="panel">
      <h3>📊 Order Status</h3>
      <div class="sub">Paid vs refunded vs failed</div>
      <div class="canvas-wrap h-mid"><canvas id="statusChart"></canvas></div>
    </div>
    <div class="panel">
      <h3>💱 Sales by Currency</h3>
      <div class="sub">Share by original currency (in ${sym})</div>
      <div class="canvas-wrap h-mid"><canvas id="currencyChart"></canvas></div>
    </div>
  </div>

  <div class="chart-row page-break">
    <div class="panel">
      <h3>📦 Top Products</h3>
      <div class="sub">Revenue by product (${sym})</div>
      <div class="canvas-wrap h-xl"><canvas id="productsChart"></canvas></div>
    </div>
  </div>

  <div class="chart-row">
    <div class="panel">
      <h3>🏆 Top Customers</h3>
      <div class="sub">Spend by customer (${sym})</div>
      <div class="canvas-wrap h-xl"><canvas id="customersChart"></canvas></div>
    </div>
  </div>

  <div class="footer">SaaS Analytics Platform — Confidential — Generated automatically</div>

  <script>
    // Animations off so charts draw synchronously; two frames later the
    // browser has painted, so we tell Puppeteer it's safe to snapshot.
    Chart.defaults.animation = false;
    Chart.defaults.font.family = "-apple-system, 'Segoe UI', Arial, sans-serif";
    const PALETTE = ${JSON.stringify(PALETTE)};
    const money = (v) => '${sym}' + Number(v).toLocaleString();

    new Chart(document.getElementById('monthlyChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(monthLabels)},
        datasets: [{
          data: ${JSON.stringify(data.monthlySales)},
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.12)',
          fill: true, tension: 0.35, borderWidth: 2,
          pointRadius: 3, pointBackgroundColor: '#7c3aed',
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.parsed.y) } } },
        scales: { y: { ticks: { callback: (v) => money(v) }, grid: { color: '#f0eef7' } }, x: { grid: { display: false } } }
      }
    });

    new Chart(document.getElementById('regionChart'), {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(regionLabels)},
        datasets: [{ data: ${JSON.stringify(regionValues)}, backgroundColor: PALETTE, borderWidth: 0 }]
      },
      options: {
        maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (c) => {
            const total = c.dataset.data.reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((c.parsed / total) * 100);
            return c.label + ': ' + money(c.parsed) + ' (' + pct + '%)';
          } } }
        }
      }
    });

    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Refunded', 'Failed'],
        datasets: [{
          data: [${data.statusBreakdown.paid}, ${data.statusBreakdown.refunded}, ${data.statusBreakdown.failed}],
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0,
        }]
      },
      options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } } }
    });

    new Chart(document.getElementById('currencyChart'), {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(currencyLabels)},
        datasets: [{ data: ${JSON.stringify(currencyValues)}, backgroundColor: PALETTE, borderWidth: 0 }]
      },
      options: {
        maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => c.label + ': ' + money(c.parsed) } } }
      }
    });

    new Chart(document.getElementById('productsChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(productLabels)},
        datasets: [{ data: ${JSON.stringify(productValues)}, backgroundColor: PALETTE, borderRadius: 5 }]
      },
      options: {
        indexAxis: 'y', maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.parsed.x) } } },
        scales: { x: { ticks: { callback: (v) => money(v) }, grid: { color: '#f0eef7' } }, y: { grid: { display: false } } }
      }
    });

    new Chart(document.getElementById('customersChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(customerLabels)},
        datasets: [{ data: ${JSON.stringify(customerValues)}, backgroundColor: '#2563eb', borderRadius: 5 }]
      },
      options: {
        indexAxis: 'y', maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.parsed.x) } } },
        scales: { x: { ticks: { callback: (v) => money(v) }, grid: { color: '#f0eef7' } }, y: { grid: { display: false } } }
      }
    });

    // Wait two paint frames, then signal Puppeteer the charts are on screen.
    requestAnimationFrame(() => requestAnimationFrame(() => { window.chartsReady = true; }));
  </script>
</body>
</html>`;
}
