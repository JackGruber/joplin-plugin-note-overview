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
  count: OverviewOptionsCount;
  details: OverviewOptionsDetails;
  escapeForTable: boolean;
};

type OverviewOptionsDetails = {
  summary: string;
  open: boolean;
};

type OverviewOptionsCount = {
  enable: boolean;
  text: string;
  position: string;
};

export { OverviewOptions };
