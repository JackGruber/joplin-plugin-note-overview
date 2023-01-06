import * as path from "path";
import * as fs from "fs-extra";
import { getPackedSettings } from "http2";
import * as YAML from "yaml";

const dataDir = path.join(__dirname, "data");
const dataNotes = path.join(dataDir, "notes");
const optionsDir = path.join(dataDir, "options");

export function getNote(id: string) {
  const data = require(path.join(dataNotes, id, "data.json"));
  const bodyFile = path.join(dataNotes, id, "body.md");

  data.id = id;
  if (fs.existsSync(bodyFile)) {
    data.body = fs.readFileSync(bodyFile, {
      encoding: "utf8",
      flag: "r",
    });
  }
  return data;
}

export function getRemoveNoteoverviewCodeData(testcase: string): Object {
  const inputFile = path.join(
    dataDir,
    "removeNoteoverviewCode",
    testcase + ".input"
  );
  const expectedFile = path.join(
    dataDir,
    "removeNoteoverviewCode",
    testcase + ".expected"
  );

  let data = { input: "no input file", expected: "no expected file" };
  if (fs.existsSync(inputFile)) {
    data.input = fs.readFileSync(inputFile, {
      encoding: "utf8",
      flag: "r",
    });
  }

  if (fs.existsSync(expectedFile)) {
    data.expected = fs.readFileSync(expectedFile, {
      encoding: "utf8",
      flag: "r",
    });
  }

  return data;
}

export function getColoringTestObject() {
  return {
    todo: {
      done_nodue: "1;2",
      open_nodue: "3;4",
      open: "5;6",
      open_overdue: "7;8",
      done: "9;10",
      done_overdue: "11;12",
      warning: "13;14",
      warningHours: 15,
    },
  };
}

export function getOptionsFromFile(optionFile: string): string {
  const file = path.join(optionsDir, optionFile + ".yml");
  const yamlData = fs.readFileSync(file, {
    encoding: "utf8",
    flag: "r",
  });
  return YAML.parse(yamlData);
}
