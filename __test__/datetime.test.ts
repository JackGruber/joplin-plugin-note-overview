import { noteoverview } from "../src/noteoverview";
import { getOptionsFromFile } from "./tools";

describe("Datetime function", function () {
  it(`empty time format`, async () => {
    const options = getOptionsFromFile("datetime");
    const optionsObject = await noteoverview.getOptions(options);

    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "";

    const testDate = new Date();
    const epoch = testDate.getTime();
    const expectedDatetimeFormated = await noteoverview.getDateFormated(
      epoch,
      dateFormat,
      timeFormat
    );

    const fields = {
      todo_due: epoch,
    };
    const result = await noteoverview.getFieldValue(
      "todo_due",
      fields,
      optionsObject
    );
    expect(result).toBe(`${expectedDatetimeFormated}`);
  });

  it(`humanize format`, async () => {
    const options = getOptionsFromFile("datetime_humanize");
    const optionsObject = await noteoverview.getOptions(options);

    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "HH:mm";

    const testDate = new Date();
    testDate.setDate(new Date().getDate() + 1);
    const epochTomorrow = testDate.getTime();
    const expectedDatetimeFormated = await noteoverview.getDateFormated(
      epochTomorrow,
      dateFormat,
      timeFormat
    );

    const fields = {
      todo_due: epochTomorrow,
    };
    const result = await noteoverview.getFieldValue(
      "todo_due",
      fields,
      optionsObject
    );

    expect(result).toBe(
      `<font title=\"${expectedDatetimeFormated}\">in a day</font>`
    );
  });

  it(`humanize without suffix format`, async () => {
    const options = getOptionsFromFile("datetime_humanize_withoutSuffix");
    const optionsObject = await noteoverview.getOptions(options);

    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "HH:mm";

    const testDate = new Date();
    testDate.setDate(new Date().getDate() + 1);
    const epochTomorrow = testDate.getTime();
    const expectedDatetimeFormated = await noteoverview.getDateFormated(
      epochTomorrow,
      dateFormat,
      timeFormat
    );

    const fields = {
      todo_due: epochTomorrow,
    };
    const result = await noteoverview.getFieldValue(
      "todo_due",
      fields,
      optionsObject
    );

    expect(result).toBe(
      `<font title=\"${expectedDatetimeFormated}\">a day</font>`
    );
  });
});
