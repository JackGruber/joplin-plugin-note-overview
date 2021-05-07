import { noteoverview } from "../src/noteoverview";

describe("String escaping for md tables", function () {
  it(`Escape |`, async () => {
    expect(await noteoverview.escapeForTable("Test | escape")).toBe(
      "Test \\| escape"
    );
  });

  it(`Escape ||`, async () => {
    expect(await noteoverview.escapeForTable("Test || escape")).toBe(
      "Test \\|\\| escape"
    );
  });

  it(`Escape multiple |`, async () => {
    expect(await noteoverview.escapeForTable("Test | with | more|escape")).toBe(
      "Test \\| with \\| more\\|escape"
    );
  });
});

describe("Date formating", function () {
  it(`Epoch 0 to empty string`, async () => {
    const epoch = 0;
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "hh:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("");
  });

  it(`Get time string`, async () => {
    const testDate = new Date(2021, 5, 21, 15, 30, 45);
    const epoch = testDate.getTime();
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "HH:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("21/06/2021 15:30");
  });
});

describe("ToDo coloring", function () {
  it(`Get coloring object`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
    expect(coloring["done_nodue"][0]).toBe("1");
    expect(coloring["done_nodue"][1]).toBe("2");
    expect(coloring["open_nodue"][0]).toBe("3");
    expect(coloring["open_nodue"][1]).toBe("4");
    expect(coloring["open"][0]).toBe("5");
    expect(coloring["open"][1]).toBe("6");
    expect(coloring["open_overdue"][0]).toBe("7");
    expect(coloring["open_overdue"][1]).toBe("8");
    expect(coloring["done"][0]).toBe("9");
    expect(coloring["done"][1]).toBe("10");
    expect(coloring["done_overdue"][0]).toBe("11");
    expect(coloring["done_overdue"][1]).toBe("12");
  });

  it(`Get coloring object (Empty) on error`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "done _nodue:1;2;open_nodue:3;4,open:5;6open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
    expect(coloring["done_nodue"].length).toBe(2);
    expect(coloring["open_nodue"].length).toBe(2);
    expect(coloring["open"].length).toBe(2);
    expect(coloring["open_overdue"].length).toBe(2);
    expect(coloring["done"].length).toBe(2);
    expect(coloring["done_overdue"].length).toBe(2);
  });

  it(`Get coloring object string part`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "open_nodue:1;2,open:3,open_overdue:,done:;4"
    );
    expect(coloring["done_nodue"].length).toBe(2);
    expect(coloring["open_nodue"].length).toBe(2);
    expect(coloring["open"].length).toBe(2);
    expect(coloring["open_overdue"].length).toBe(2);
    expect(coloring["done"].length).toBe(2);
    expect(coloring["done_overdue"].length).toBe(2);

    expect(coloring["done_nodue"][0]).toBe("");
    expect(coloring["done_nodue"][1]).toBe("");
    expect(coloring["open_nodue"][0]).toBe("1");
    expect(coloring["open_nodue"][1]).toBe("2");
    expect(coloring["open"][0]).toBe("3");
    expect(coloring["open"][1]).toBe("");
    expect(coloring["open_overdue"][0]).toBe("");
    expect(coloring["open_overdue"][1]).toBe("");
    expect(coloring["done"][0]).toBe("");
    expect(coloring["done"][1]).toBe("4");
    expect(coloring["done_overdue"][0]).toBe("");
    expect(coloring["done_overdue"][1]).toBe("");
  });

  it(`Get coloring object (Empty)`, async () => {
    const coloring = await noteoverview.getToDoColorObject("");
    expect(coloring["done_nodue"].length).toBe(2);
    expect(coloring["open_nodue"].length).toBe(2);
    expect(coloring["open"].length).toBe(2);
    expect(coloring["open_overdue"].length).toBe(2);
    expect(coloring["done"].length).toBe(2);
    expect(coloring["done_overdue"].length).toBe(2);
  });

  it(`Get coloring object (Spaces)`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue: 1; 2,open_nodue :3 ; 4,open:5;6 , open_overdue: 7 ;8,done:9;10,done_overdue:11;12"
    );
    expect(coloring["done_nodue"][0]).toBe("1");
    expect(coloring["done_nodue"][1]).toBe("2");
    expect(coloring["open_nodue"][0]).toBe("3");
    expect(coloring["open_nodue"][1]).toBe("4");
    expect(coloring["open"][0]).toBe("5");
    expect(coloring["open"][1]).toBe("6");
    expect(coloring["open_overdue"][0]).toBe("7");
    expect(coloring["open_overdue"][1]).toBe("8");
    expect(coloring["done"][0]).toBe("9");
    expect(coloring["done"][1]).toBe("10");
    expect(coloring["done_overdue"][0]).toBe("11");
    expect(coloring["done_overdue"][1]).toBe("12");
  });

  it(`Get coloring object (multiple)`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:99;99,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12,done_nodue:1;2"
    );
    expect(coloring["done_nodue"][0]).toBe("1");
    expect(coloring["done_nodue"][1]).toBe("2");
    expect(coloring["open_nodue"][0]).toBe("3");
    expect(coloring["open_nodue"][1]).toBe("4");
    expect(coloring["open"][0]).toBe("5");
    expect(coloring["open"][1]).toBe("6");
    expect(coloring["open_overdue"][0]).toBe("7");
    expect(coloring["open_overdue"][1]).toBe("8");
    expect(coloring["done"][0]).toBe("9");
    expect(coloring["done"][1]).toBe("10");
    expect(coloring["done_overdue"][0]).toBe("11");
    expect(coloring["done_overdue"][1]).toBe("12");
  });

  it(`Get coloring object (to much ,)`, async () => {
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:99;99,open_,nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12,done_nodue:1;2,"
    );
    expect(coloring["done_nodue"][0]).toBe("1");
    expect(coloring["done_nodue"][1]).toBe("2");
    expect(coloring["open_nodue"][0]).toBe("");
    expect(coloring["open_nodue"][1]).toBe("");
    expect(coloring["open"][0]).toBe("5");
    expect(coloring["open"][1]).toBe("6");
    expect(coloring["open_overdue"][0]).toBe("7");
    expect(coloring["open_overdue"][1]).toBe("8");
    expect(coloring["done"][0]).toBe("9");
    expect(coloring["done"][1]).toBe("10");
    expect(coloring["done_overdue"][0]).toBe("11");
    expect(coloring["done_overdue"][1]).toBe("12");
  });

  it(`ToDo open no due date`, async () => {
    const todo_due = 0;
    const todo_completed = 0;
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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

  it(`ToDo open in due date`, async () => {
    const now = new Date().getTime();
    const todo_due = new Date(now + 60 * 60 * 24).getTime();
    const todo_completed = 0;
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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
    const coloring = await noteoverview.getToDoColorObject(
      "done_nodue:1;2,open_nodue:3;4,open:5;6,open_overdue:7;8,done:9;10,done_overdue:11;12"
    );
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
