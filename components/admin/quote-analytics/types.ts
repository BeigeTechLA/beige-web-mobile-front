export type QuoteAnalyticsRecord = {
  id: string;
  client: string;
  email: string;
  quotesSent: number;
  quoteValue: number;
  dealWon: number;
  winRate: number;
  wonRevenue: number;
  averageDealSize: number;
  openPipeline: number;
  followUps: number;
  status: "Accepted" | "Sent" | "Partially Paid" | "Overdue";
};

export const quoteAnalyticsRecords: QuoteAnalyticsRecord[] = [
  { id: "QS-001", client: "John Smith", email: "john.smith@gmail.com", quotesSent: 42, quoteValue: 84000, dealWon: 12, winRate: 28.6, wonRevenue: 32000, averageDealSize: 2670, openPipeline: 4000000, followUps: 1, status: "Accepted" },
  { id: "QS-002", client: "Michael Green", email: "michael.green@gmail.com", quotesSent: 36, quoteValue: 68000, dealWon: 9, winRate: 25, wonRevenue: 24000, averageDealSize: 2670, openPipeline: 3000000, followUps: 3, status: "Sent" },
  { id: "QS-003", client: "Olivia Brown", email: "olivia.brown@gmail.com", quotesSent: 32, quoteValue: 52000, dealWon: 8, winRate: 25, wonRevenue: 18000, averageDealSize: 2250, openPipeline: 2700000, followUps: 5, status: "Partially Paid" },
  { id: "QS-004", client: "Lisa Smith", email: "lisa.smith@gmail.com", quotesSent: 33, quoteValue: 41000, dealWon: 6, winRate: 18.2, wonRevenue: 13000, averageDealSize: 2160, openPipeline: 2000000, followUps: 2, status: "Overdue" },
  { id: "QS-005", client: "Ethan Carter", email: "ethan.carter@gmail.com", quotesSent: 32, quoteValue: 76000, dealWon: 10, winRate: 31.2, wonRevenue: 29000, averageDealSize: 2900, openPipeline: 3100000, followUps: 2, status: "Accepted" },
  { id: "QS-006", client: "Ava Wilson", email: "ava.wilson@gmail.com", quotesSent: 31, quoteValue: 46000, dealWon: 7, winRate: 22.5, wonRevenue: 16000, averageDealSize: 2285, openPipeline: 1800000, followUps: 4, status: "Sent" },
];

export const currency = (value: number) => `$${value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : value.toLocaleString()}`;
