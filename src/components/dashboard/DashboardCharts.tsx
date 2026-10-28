import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const visitors = [
  { month: 'JAN', visitors: 12, buyers: 8 },
  { month: 'FEB', visitors: 14, buyers: 9 },
  { month: 'MAR', visitors: 17, buyers: 10 },
  { month: 'APR', visitors: 18, buyers: 11 },
  { month: 'MAY', visitors: 20, buyers: 13 },
  { month: 'JUN', visitors: 17, buyers: 12 },
  { month: 'JUL', visitors: 15, buyers: 10 },
  { month: 'AUG', visitors: 13, buyers: 9 },
  { month: 'SEP', visitors: 12, buyers: 8 },
  { month: 'OCT', visitors: 11, buyers: 8 },
  { month: 'NOV', visitors: 13, buyers: 9 },
  { month: 'DEC', visitors: 16, buyers: 10 },
];

const funnel = [
  { name: 'Visitors', value: 8273, fill: '#f59e0b' },
  { name: 'Interested', value: 6200, fill: '#fb923c' },
  { name: 'Engaged', value: 4200, fill: '#14b8a6' },
  { name: 'Buyers', value: 1051, fill: '#0f766e' },
];

const sales = [
  { month: 'JAN', sales: 95, purchases: 120 },
  { month: 'FEB', sales: 130, purchases: 150 },
  { month: 'MAR', sales: 155, purchases: 140 },
  { month: 'APR', sales: 180, purchases: 170 },
  { month: 'MAY', sales: 145, purchases: 160 },
  { month: 'JUN', sales: 130, purchases: 135 },
  { month: 'JUL', sales: 110, purchases: 145 },
  { month: 'AUG', sales: 120, purchases: 125 },
  { month: 'SEP', sales: 140, purchases: 115 },
  { month: 'OCT', sales: 160, purchases: 130 },
  { month: 'NOV', sales: 145, purchases: 155 },
  { month: 'DEC', sales: 175, purchases: 145 },
];

const tooltipStyle = {
  backgroundColor: 'var(--chart-tooltip)',
  border: '1px solid var(--chart-border)',
  borderRadius: '10px',
  color: 'var(--chart-text)',
  fontSize: 12,
};

function Panel({
  title,
  children,
  className = '',
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={[
        'min-w-0 rounded-2xl border p-3 shadow-sm transition-all duration-300',
        'border-[#eadfd5] bg-white hover:shadow-md',
        'dark:border-white/10 dark:bg-[#11171c] dark:hover:border-cyan-400/30',
        'sm:p-4 lg:p-5',
        className,
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold tracking-tight sm:text-base">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function VisitorsChart() {
  return (
    <Panel title="Visitors & Buyers" className="lg:col-span-2">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs">
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Visitors <b>11,427</b>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-teal-500" />
          Buyers <b>5,256</b>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-sky-500" />
          New <b>1,051</b>
        </span>
      </div>

      <div className="h-[220px] w-full sm:h-[255px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visitors} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--chart-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--chart-muted)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="buyers" fill="#c5a58b" radius={[3, 3, 0, 0]} />
            <Line dataKey="visitors" type="monotone" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function ConversionChart() {
  const data = [
    { name: 'Buyers', value: 46, fill: '#0d9488' },
    { name: 'Visitors', value: 30, fill: '#f97316' },
    { name: 'New', value: 24, fill: '#fbbf24' },
  ];

  return (
    <Panel title="Conversion">
      <div className="relative h-[220px] sm:h-[255px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="53%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs opacity-60">Buyers</span>
          <strong className="text-2xl font-black">46%</strong>
        </div>
      </div>
      <p className="text-center text-xs opacity-60">New visitors: 9%</p>
    </Panel>
  );
}

export function RoadmapChart() {
  const data = [
    { name: 'Completed', value: 33, fill: '#0d9488' },
    { name: 'In progress', value: 35, fill: '#f97316' },
    { name: 'Planned', value: 32, fill: '#cbd5e1' },
  ];

  return (
    <Panel title="Roadmap" action={<strong className="text-xl">33%</strong>}>
      <div className="relative h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="52%"
              outerRadius="82%"
              startAngle={210}
              endAngle={-30}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold opacity-60">
          Project plan
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] opacity-70">
        <span>● Completed</span>
        <span>● In progress</span>
        <span>● Planned</span>
      </div>
    </Panel>
  );
}


export function SalesFunnelChart() {
  return (
    <Panel title="Sales Funnel">
      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnel}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={75}
              tick={{ fontSize: 10, fill: 'var(--chart-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              barSize={22}
            >
              {funnel.map((item) => (
                <Cell key={item.name} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <strong className="text-2xl">1,051</strong>
        <p className="text-xs opacity-60">Converted buyers · 13%</p>
      </div>
    </Panel>
  );
}


export function SalesVolumeChart() {
  return (
    <Panel
      title="Sales Volume"
      className="lg:col-span-2"
      action={
        <div className="hidden flex-wrap gap-3 text-[10px] sm:flex">
          <span className="text-teal-600 dark:text-teal-300">● Sales</span>
          <span className="text-sky-600 dark:text-sky-300">● Purchases</span>
        </div>
      }
    >
      <div className="mb-2 flex gap-4 text-[10px] sm:hidden">
        <span className="text-teal-600 dark:text-teal-300">● Sales</span>
        <span className="text-sky-600 dark:text-sky-300">● Purchases</span>
      </div>

      <div className="h-[210px] sm:h-[235px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sales} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--chart-muted)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--chart-muted)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line dataKey="sales" name="Sales" type="monotone" stroke="#0d9488" strokeWidth={2.5} dot={false} />
            <Line dataKey="purchases" name="Purchases" type="monotone" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
