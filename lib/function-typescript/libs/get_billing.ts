import { CostExplorer } from 'aws-sdk'

const costExplorer = new CostExplorer({region: 'us-east-1'});

export async function main(): Promise<[string, string]> {
  const totalBilling = await getTotalBilling();
  const serviceBillings = await getServiceBillings();
  return getMessage(totalBilling, serviceBillings);
};

async function getTotalBilling() {
  const [startDate, endDate] = getTotalCostDateRange();
  const params = {
    TimePeriod: {
      Start: startDate,
      End: endDate
    },
    Granularity: 'MONTHLY',
    Metrics: ['AmortizedCost']
  };

  const response = await costExplorer.getCostAndUsage(params).promise();
  const results = response.ResultsByTime[0];

  return {
    start: results.TimePeriod.Start,
    end: results.TimePeriod.End,
    billing: results.Total.AmortizedCost.Amount
  };
};

async function getServiceBillings() {
  const [startDate, endDate] = getTotalCostDateRange();
  const params = {
    TimePeriod: {
      Start: startDate,
      End: endDate
    },
    Granularity: 'MONTHLY',
    Metrics: ['AmortizedCost'],
    GroupBy: [{
      Type: 'DIMENSION',
      Key: 'SERVICE'
    }]
  };

  const response = await costExplorer.getCostAndUsage(params).promise();
  const items = response.ResultsByTime[0].Groups;

  return items.map((item: {Keys: Array<string>, Metrics: {AmortizedCost: {Amount: string}}}) => ({
    serviceName: item.Keys[0],
    billing: item.Metrics.AmortizedCost.Amount
  }));
};

function getMessage(totalBilling: {start: string, end: string, billing: string}, serviceBillings: Array<{serviceName: string, billing: string}>): [string, string] {
  const start = formatDate(totalBilling.start);
  const end = formatDate(subtractOneDay(totalBilling.end));
  const total = parseFloat(totalBilling.billing);

  const title = `${start} - ${end}の請求額：${total.toFixed(2)} USD`;

  const details = serviceBillings.map(item => {
      const billing = parseFloat(item.billing);
      if (billing === 0.0) {
        return null;
      }
      return `・${item.serviceName}: ${billing.toFixed(2)} USD`;
  }).filter(item => item !== null);

  return [title, details.join('\n')];
};

function getTotalCostDateRange(): [string, string] {
  const startDate = getBeginOfMonth();
  const endDate = getToday();

  if (new Date(startDate).getMonth() === new Date(endDate).getMonth()) {
    const endOfMonth = subtractOneDay(startDate);
    const startOfMonth = getBeginOfMonth(new Date(endOfMonth));
    return [startOfMonth, endDate];
  }

  return [startDate, endDate];
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

function subtractOneDay(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

function getBeginOfMonth(today: Date = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), 1);
  return date.toISOString().split('T')[0];
};

function getToday(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
