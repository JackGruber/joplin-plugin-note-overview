type OverviewOptions = {
  statusText: any;
  fields: string;
  sortStr: string;
  orderBy: string;
  orderDir: string;
  alias: string;
  imageSettings: any;
  excerptSettings: any;
  coloring: any;
  noteCount: string;
  details: OverviewOptionsDetails;
};

type OverviewOptionsDetails = {
  summary: string;
  open: boolean;
};

export { OverviewOptions };
