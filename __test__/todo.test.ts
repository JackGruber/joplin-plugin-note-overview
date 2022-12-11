import { noteoverview, logging } from "../src/noteoverview";
import joplin from "api";
import { when } from "jest-when";
import { getColoringTestObject } from "./tools";

const spyOnsSettingsValue = jest.spyOn(joplin.settings, "value");

describe("ToDo status text", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});

    /* prettier-ignore */
    when(spyOnsSettingsValue)
        .mockImplementation(() => Promise.resolve("no mockImplementation"));
  });

  afterEach(async () => {
    jest.spyOn(logging, "silly").mockReset();
    jest.spyOn(logging, "verbose").mockReset();
    jest.spyOn(logging, "info").mockReset();
    spyOnsSettingsValue.mockReset();
  });

  describe("ToDo status text", function () {
    it(`Status `, async () => {
      const now = new Date().getTime();

      const testCases = [
        [0, 0, "open"],
        [0, now, "done"],
        [now - 86400, 0, "overdue"],
        [now + 86400, now - 86400, "done"],
        [now - 86400, now + 86400, "done"],
      ];

      for (const t of testCases) {
        const todo_due = Number(t[0]);
        const todo_completed = Number(t[1]);
        const expected = t[2];
        const actual = await noteoverview.getToDoStatus(
          todo_due,
          todo_completed
        );
        expect(actual).toBe(expected);
      }
    });
  });

  describe("ToDo coloring", function () {
    it(`Default color Object`, async () => {
      /* prettier-ignore */
      when(spyOnsSettingsValue)
        .calledWith("colorTodoOpen").mockImplementation(() => Promise.resolve("1"))
        .calledWith("colorTodoWarning").mockImplementation(() => Promise.resolve("2"))
        .calledWith("todoWarningHours").mockImplementation(() => Promise.resolve(3))
        .calledWith("colorTodoOpenOverdue").mockImplementation(() => Promise.resolve("4"))
        .calledWith("colorTodoDone").mockImplementation(() => Promise.resolve("5"))
        .calledWith("colorTodoDoneNodue").mockImplementation(() => Promise.resolve("6"))
        .calledWith("colorTodoDoneOverdue").mockImplementation(() => Promise.resolve("7"));
      const colorObject = await noteoverview.getDefaultColoring();
      expect(colorObject).toHaveProperty("todo");
      expect(colorObject["todo"]).toHaveProperty("done");
      expect(colorObject["todo"]).toHaveProperty("done_nodue");
      expect(colorObject["todo"]).toHaveProperty("done_overdue");
      expect(colorObject["todo"]).toHaveProperty("open");
      expect(colorObject["todo"]).toHaveProperty("open_nodue");
      expect(colorObject["todo"]).toHaveProperty("open_overdue");
      expect(colorObject["todo"]).toHaveProperty("warning");
      expect(colorObject["todo"]).toHaveProperty("warningHours");

      expect(colorObject["todo"]["open_nodue"]).toBe("");
      expect(colorObject["todo"]["open"]).toBe("1");
      expect(colorObject["todo"]["warning"]).toBe("2");
      expect(colorObject["todo"]["warningHours"]).toBe(3);
      expect(colorObject["todo"]["open_overdue"]).toBe("4");
      expect(colorObject["todo"]["done"]).toBe("5");
      expect(colorObject["todo"]["done_nodue"]).toBe("6");
      expect(colorObject["todo"]["done_overdue"]).toBe("7");
    });

    it(`ToDo open no due date`, async () => {
      const todo_due = 0;
      const todo_completed = 0;
      const coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("3");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("4");
    });

    it(`ToDo done no due date`, async () => {
      const now = new Date().getTime();
      const todo_due = 0;
      const todo_completed = new Date(now - 60 * 60 * 24).getTime();
      const coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("1");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("2");
    });

    it(`ToDo coloring with ;`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = 0;
      const coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("5");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("6");
    });

    it(`ToDo coloring only one color`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = 0;
      let coloring = getColoringTestObject();
      coloring["todo"]["open"] = "5";

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("5");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("5");
    });

    it(`ToDo coloring with ,`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = 0;
      let coloring = getColoringTestObject();
      coloring["todo"]["open"] = "5,6";

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("5");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("6");
    });

    it(`ToDo open in due date and warning range`, async () => {});

    it(`ToDo open in due date`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = 0;
      let coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("5");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("6");
    });

    it(`ToDo open over due date`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now - 60 * 60 * 24).getTime();
      const todo_completed = 0;
      let coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("7");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("8");
    });

    it(`ToDo done in due date`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = new Date(now - 60 * 60 * 24).getTime();
      let coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("9");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("10");
    });

    it(`ToDo done over due date`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now - 60 * 60 * 24).getTime();
      const todo_completed = new Date(now + 60 * 60 * 24).getTime();
      let coloring = getColoringTestObject();

      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_due"
        )
      ).toBe("11");
      expect(
        await noteoverview.getToDoDateColor(
          coloring,
          todo_due,
          todo_completed,
          "todo_completed"
        )
      ).toBe("12");
    });
  });
});
