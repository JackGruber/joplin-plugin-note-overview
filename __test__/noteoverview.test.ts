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
