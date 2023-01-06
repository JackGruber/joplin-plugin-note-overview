import joplin from "api";
import { noteoverview, logging } from "../src/noteoverview";
import { when, verifyAllWhenMocksCalled } from "jest-when";
import { getNote } from "./tools";

const spyOnGlobalValue = jest.spyOn(joplin.settings, "globalValue");

describe("noteoverview.update", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});

    /* prettier-ignore */
    when(spyOnGlobalValue)
      .mockImplementation(() => Promise.resolve("no mockImplementation"))
      .calledWith("locale").mockImplementation(() => Promise.resolve("en"));
  });

  afterEach(async () => {
    jest.spyOn(logging, "silly").mockReset();
    jest.spyOn(logging, "verbose").mockReset();
    jest.spyOn(logging, "info").mockReset();
    spyOnGlobalValue.mockReset();
  });

  it(`Check calls of getOverviewContent function`, async () => {
    /* prettier-ignore */
    const testCases = [
        { noteid: "simpleEmpty", expected: 1, },
        { noteid: "simple", expected: 1, },
        { noteid: "multipleEmpty", expected: 3, },
        { noteid: "codeBlock", expected: 2, },
      ];

    const spyOnegetOverviewContent = jest.spyOn(
      noteoverview,
      "getOverviewContent"
    );
    jest
      .spyOn(joplin.workspace, "selectedNote")
      .mockImplementation(() => Promise.resolve("someSelectedNote"));
    const spyOnJoplinDataGet = jest.spyOn(joplin.data, "get");

    for (const testCase of testCases) {
      spyOnJoplinDataGet.mockReset();
      /* prettier-ignore */
      when(spyOnJoplinDataGet)
          .mockImplementation(() => Promise.resolve("no mockImplementation"))
          .calledWith(expect.arrayContaining(["notes", testCase.noteid]),expect.anything())
            .mockImplementation(() => Promise.resolve( getNote(testCase.noteid) ));

      // check calls to getOverviewContent
      await noteoverview.update(testCase.noteid, false);
      expect(spyOnegetOverviewContent).toBeCalledTimes(testCase.expected);
      spyOnegetOverviewContent.mockClear();
    }
  });

  it(`RegEx codeblock`, async () => {
    //
  });
});
