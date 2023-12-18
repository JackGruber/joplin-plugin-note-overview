import joplin from "api";
import { noteoverview, logging } from "../src/noteoverview";
import { when, verifyAllWhenMocksCalled } from "jest-when";
import { getNote } from "./tools";

const spyOnGlobalValue = jest.spyOn(joplin.settings, "globalValue");
const spyOnselectedNote = jest.spyOn(joplin.workspace, "selectedNote");

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

  it(`Update setting manual / automatic`, async () => {
    /* prettier-ignore */
    const testCases = [
      { userTriggerd: true, noteSelected: false, expected: 2 },
      { userTriggerd: true, noteSelected: true, expected: 3 },
      { userTriggerd: false, noteSelected: true, expected: 2 },
      { userTriggerd: false, noteSelected: false, expected: 2 },
    ];

    const spyOnegetOverviewContent = jest.spyOn(
      noteoverview,
      "getOverviewContent"
    );
    jest
      .spyOn(joplin.workspace, "selectedNote")
      .mockImplementation(() => Promise.resolve("someSelectedNote"));
    const spyOnJoplinDataGet = jest.spyOn(joplin.data, "get");

    const noteId = "updateSetting";
    for (const testCase of testCases) {
      spyOnJoplinDataGet.mockReset();
      /* prettier-ignore */
      when(spyOnJoplinDataGet)
        .mockImplementation(() => Promise.resolve("no mockImplementation"))
        .calledWith(expect.arrayContaining(["notes", noteId]),expect.anything())
          .mockImplementation(() => Promise.resolve( getNote(noteId) ));

      let selectedNote = { id: "some other id" };
      if (testCase.noteSelected) {
        selectedNote = { id: noteId };
      }
      spyOnselectedNote.mockImplementation(() => Promise.resolve(selectedNote));

      // check calls to getOverviewContent
      await noteoverview.update("updateSetting", testCase.userTriggerd);
      //expect(spyOnselectedNote).toBeCalledTimes(99);
      expect(spyOnegetOverviewContent).toBeCalledTimes(testCase.expected);
      spyOnegetOverviewContent.mockClear();
      spyOnselectedNote.mockClear();
    }
  });

  it(`RegEx codeblock`, async () => {
    //
  });
});
