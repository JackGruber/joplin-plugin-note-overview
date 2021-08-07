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
  noteCount: OverviewOptionsNoteCount;
  details: OverviewOptionsDetails;
};

type OverviewOptionsDetails = {
  summary: string;
  open: boolean;
};

type OverviewOptionsNoteCount = {
  enable: boolean;
  text: string;
  position: string;
};

export { OverviewOptions };
