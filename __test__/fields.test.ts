import { noteoverview, logging } from "../src/noteoverview";
import { getOptionsFromFile } from "./tools";

describe("Field function", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.spyOn(logging, "silly").mockReset();
    jest.spyOn(logging, "verbose").mockReset();
    jest.spyOn(logging, "info").mockReset();
  });

  it(`link html`, async () => {
    const options = getOptionsFromFile("field_link_html");
    const optionsObject = await noteoverview.getOptions(options);
    const fields = {
      source_url: "http://test.test",
    };
    const result = await noteoverview.getFieldValue(
      "link",
      fields,
      optionsObject
    );
    expect(result).toBe('<a href="' + fields["source_url"] + '">data</a>');
  });

  it(`link`, async () => {
    const options = getOptionsFromFile("field_link");
    const optionsObject = await noteoverview.getOptions(options);
    const fields = {
      source_url: "http://test.test",
    };
    const result = await noteoverview.getFieldValue(
      "link",
      fields,
      optionsObject
    );
    expect(result).toBe("[Link](" + fields["source_url"] + ")");
  });
});

describe("note status text", function () {
  it(`Status `, async () => {
    const options = getOptionsFromFile("note_status");
    const optionsObject = await noteoverview.getOptions(options);

    const now = new Date().getTime();
    const testCases = [
      [0, 0, 0, "n"],
      [1, 0, 0, "o"],
      [1, 0, now, "d"],
      [1, now - 86400, 0, "od"],
      [1, now + 86400, now - 86400, "d"],
      [1, now - 86400, now + 86400, "d"],
    ];

    for (const t of testCases) {
      const fields: Object = {
        is_todo: Number(t[0]),
        todo_due: Number(t[1]),
        todo_completed: Number(t[2]),
      };
      const expected = t[3];
      const actual = await noteoverview.getFieldValue(
        "status",
        fields,
        optionsObject
      );
      expect(actual).toBe(expected);
    }
  });
});
