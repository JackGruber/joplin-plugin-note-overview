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
