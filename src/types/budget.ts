export type Budget = {
  id: number;
  category: string;
  monthlyLimit: number;
  dismissedAlertMonth: string | null;
  rollover: boolean;
};
