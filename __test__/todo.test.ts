import { noteoverview, logging } from "../src/noteoverview";

describe("ToDo status text", function () {
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
    it(`ToDo open no due date`, async () => {
      const todo_due = 0;
      const todo_completed = 0;
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5,6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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

    it(`ToDo open in due date`, async () => {
      const now = new Date().getTime();
      const todo_due = new Date(now + 60 * 60 * 24).getTime();
      const todo_completed = 0;
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
      const coloring = {
        todo: {
          done_nodue: "1;2",
          open_nodue: "3;4",
          open: "5;6",
          open_overdue: "7;8",
          done: "9;10",
          done_overdue: "11;12",
        },
      };

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
