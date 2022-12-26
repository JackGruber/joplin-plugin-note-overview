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
  listview: OverviewListview;
  escapeForTable: boolean;
  link: OverviewOptionsLink;
};

type OverviewOptionsLink = {
  caption: string;
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

type OverviewListview = {
  separator: string;
  text: string;
  linebreak: boolean;
  prefix: string;
  suffix: string;
};

export { OverviewOptions };
