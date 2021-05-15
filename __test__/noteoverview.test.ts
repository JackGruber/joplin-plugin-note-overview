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

describe("ToDo status text", function () {
  it(`Status `, async () => {
    const now = new Date().getTime();

    const testCases = [
      [0, 0, "todo_open"],
      [0, now, "todo_done"],
      [now - 86400, 0, "todo_overdue"],
      [now + 86400, now - 86400, "todo_done"],
      [now - 86400, now + 86400, "todo_done"],
    ];

    for (const t of testCases) {
      const todo_due = Number(t[0]);
      const todo_completed = Number(t[1]);
      const expected = t[2];
      const actual = await noteoverview.getToDoStatus(todo_due, todo_completed);
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

describe("Singel tests", function () {
  it(`humanFrendlyStorageSize`, async () => {
    const testCases = [
      [50, "50 Byte"],
      [1024, "1.00 KiB"],
      [1024 * 1024, "1.00 MiB"],
      [1024 * 1024 * 10, "10.00 MiB"],
      [1024 * 1024 * 1024 * 3, "3.00 GiB"],
      [1024 * 1024 * 1000 * 3, "2.93 GiB"],
    ];

    for (const t of testCases) {
      const input = Number(t[0]);
      const expected = t[1];
      const actual = await noteoverview.humanFrendlyStorageSize(input);
      expect(actual).toBe(expected);
    }
  });
});

describe("Get image nr X from body", function () {
  it(`with default settings`, async () => {
    let imageSettings = null;
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)  
        `;

    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='200' height='200'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='200' height='200'>`
    );

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(``);
  });

  it(`with settings`, async () => {
    let imageSettings = { width: 100, height: 300, exactnr: false };
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)  
        `;

    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='100' height='300'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300'>`
    );

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300'>`
    );
  });
});
