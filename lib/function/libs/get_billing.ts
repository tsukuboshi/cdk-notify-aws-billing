import { CostExplorer } from "aws-sdk";

type BillingInfo = {
  start: string;
  end: string;
  billing: string;
};

type ServiceBilling = {
  serviceName: string;
  billing: string;
};

export async function main(): Promise<[string, string]> {
  console.log("Get billing information...");

  const client = new CostExplorer({ region: "us-east-1" });

  const totalBilling = await getTotalBilling(client);
  const serviceBillings = await getServiceBillings(client);
  const [title, detail] = getMessage(totalBilling, serviceBillings);
  return [title, detail];
}

async function getTotalBilling(client: AWS.CostExplorer): Promise<BillingInfo> {
  const [startDate, endDate] = getTotalCostDateRange();

  const response = await client
    .getCostAndUsage({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: "MONTHLY",
      Metrics: ["AmortizedCost"],
    })
    .promise();

  if (!response.ResultsByTime || response.ResultsByTime.length === 0) {
    throw new Error("No results returned from AWS Cost Explorer");
  }

  const result = response.ResultsByTime[0];

  if (!result.TimePeriod || !result.Total || !result.Total.AmortizedCost) {
    throw new Error("Invalid data structure in AWS Cost Explorer response");
  }

  const amount = result.Total.AmortizedCost.Amount;
  if (amount === undefined) {
    throw new Error("Amount is undefined in AWS Cost Explorer response");
  }

  return {
    start: result.TimePeriod.Start,
    end: result.TimePeriod.End,
    billing: amount,
  };
}

async function getServiceBillings(
  client: AWS.CostExplorer,
): Promise<ServiceBilling[]> {
  const [startDate, endDate] = getTotalCostDateRange();

  const response = await client
    .getCostAndUsage({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: "MONTHLY",
      Metrics: ["AmortizedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
    })
    .promise();

  if (!response.ResultsByTime || response.ResultsByTime.length === 0) {
    throw new Error("No results returned from AWS Cost Explorer");
  }

  const result = response.ResultsByTime[0];

  if (!result.Groups) {
    throw new Error("No group data in AWS Cost Explorer response");
  }

  return result.Groups.map((item) => {
    if (!item.Metrics || !item.Metrics.AmortizedCost || !item.Keys) {
      throw new Error("Invalid data in AWS Cost Explorer response");
    }
    const amount = item.Metrics.AmortizedCost.Amount;
    if (amount === undefined) {
      throw new Error(
        "Amount is undefined for a service in AWS Cost Explorer response",
      );
    }
    return {
      serviceName: item.Keys[0],
      billing: amount,
    };
  });
}

function getMessage(
  totalBilling: BillingInfo,
  serviceBillings: ServiceBilling[],
): [string, string] {
  const start = formatDate(new Date(totalBilling.start));
  const endToday = new Date(totalBilling.end);
  const endYesterday = formatDate(
    new Date(endToday.getTime() - 24 * 60 * 60 * 1000),
  );

  const total = parseFloat(totalBilling.billing).toFixed(2);

  const title = `${start}～${endYesterday}の請求額：${total} USD`;

  const details = serviceBillings
    .filter((item) => parseFloat(item.billing) !== 0.0)
    .map(
      (item) =>
        `・${item.serviceName}: ${parseFloat(item.billing).toFixed(2)} USD`,
    );

  return [title, details.join("\n")];
}

function formatDate(date: Date): string {
  return `${padZero(date.getMonth() + 1)}/${padZero(date.getDate())}`;
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function getTotalCostDateRange(): [string, string] {
  const startDate = getBeginOfMonth();
  const endDate = getToday();

  if (startDate === endDate) {
    const endOfMonth = new Date(startDate);
    endOfMonth.setDate(endOfMonth.getDate() - 1);
    const beginOfMonth = new Date(
      endOfMonth.getFullYear(),
      endOfMonth.getMonth(),
      1,
    );
    return [beginOfMonth.toISOString().split("T")[0], endDate];
  }
  return [startDate, endDate];
}

function getBeginOfMonth(): string {
  const now = new Date();
  const beginOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return beginOfMonth.toISOString().split("T")[0];
}

// function getPrevDay(prev: number): string {
//   const date = new Date();
//   date.setDate(date.getDate() - prev);
//   return date.toISOString().split("T")[0];
// }

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
