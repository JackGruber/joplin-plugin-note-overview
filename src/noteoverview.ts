import * as moment from "moment";
import joplin from "api";
//import * as naturalCompare from 'string-natural-compare';
const naturalCompare = require('string-natural-compare');
export namespace noteoverview {
    // Get all tags title as array for a note id
    export async function getTags(noteId): Promise<any> {
      const tagNames = [];
      let pageNum = 1;
      do {
        try {
          var tags = await joplin.data.get(["notes", noteId, "tags"], {
            fields: "id, title, parent_id",
            limit: 50,
            page: pageNum++,
          });
        } catch (e) {
          console.error("getTags " + e);
          tagNames.push("n/a");
          return tagNames;
        }
        for (const tag of tags.items) {
          tagNames.push(tag.title);
        }
      } while (tags.has_more);

      tagNames.sort((a, b) => {
        return naturalCompare(a, b, {caseInsensitive: true});
      });

      return tagNames;
    }


  // Escape string for markdown table
  export async function escapeForTable(str: string): Promise<string> {
    if (str !== undefined) {
      return str
        .toString()
        .replace(/(?:\|)/g, "\\|")
        .replace(/(?:\r\n|\r|\n)/g, "");
    } else {
      return str;
    }
  }

  export async function getDateFormated(
    epoch: number,
    dateFormat: string,
    timeFormat: string
  ): Promise<String> {
    if (epoch !== 0) {
      const dateObject = new Date(epoch);
      const dateString =
        moment(dateObject.getTime()).format(dateFormat) +
        " " +
        moment(dateObject.getTime()).format(timeFormat);

      return dateString;
    } else {
      return "";
    }
  }

  export async function getToDoDateColor(
    coloring: object,
    todo_due: number,
    todo_completed: number,
    type: string
  ): Promise<string> {
    const now = new Date();
    let colorType = "";

    if (todo_due === 0 && todo_completed === 0) {
      // ToDo open no due date
      colorType = "open_nodue";
    } else if (todo_due === 0 && todo_completed !== 0) {
      // ToDo done no due date
      colorType = "done_nodue";
    } else if (todo_due > now.getTime() && todo_completed === 0) {
      // ToDo open in time
      colorType = "open";
    } else if (todo_due < now.getTime() && todo_completed === 0) {
      // ToDo open over time
      colorType = "open_overdue";
    } else if (todo_due > todo_completed) {
      // ToDo done in time
      colorType = "done";
    } else if (todo_due < todo_completed) {
      // ToDo done over time
      colorType = "done_overdue";
    } else {
      return "";
    }

    if (type === "todo_due") return coloring[colorType][0];
    else if (type === "todo_completed") return coloring[colorType][1];
    else return "";
  }

  export async function getToDoColorObject(color: string): Promise<Object> {
    let coloring = {
      done_nodue: ["", ""],
      open_nodue: ["", ""],
      open: ["", ""],
      open_overdue: ["", ""],
      done: ["", ""],
      done_overdue: ["", ""],
    };

    try {
      const set = color.toLowerCase().split(/\s*,\s*/);
      for (const pair of set) {
        if (pair.indexOf(":") !== -1) {
          let key = pair.split(/\s*:\s*/)[0].trim();
          let color = pair.split(/\s*:\s*/)[1].trim();
          if (color.indexOf(";") !== -1) coloring[key] = color.split(/\s*;\s*/);
          else {
            coloring[key][0] = color.trim();
            coloring[key][1] = "";
          }
        }
      }
    } catch (error) {}

    return coloring;
  }

  export async function getDefaultToDoColors(): Promise<string> {
    let colors = [];
    colors.push("open:" + (await joplin.settings.value("colorTodoOpen")));
    colors.push(
      "open_overdue:" + (await joplin.settings.value("colorTodoOpenOverdue"))
    );
    colors.push("done:" + (await joplin.settings.value("colorTodoDone")));
    colors.push(
      "done_overdue:" + (await joplin.settings.value("colorTodoDoneOverdue"))
    );
    colors.push(
      "done_nodue:" + (await joplin.settings.value("colorTodoDoneNodue"))
    );

    return colors.join(",");
  }

  export async function humanFrendlyStorageSize(size: number): Promise<string> {
    if (size < 1024) {
      return size + " Byte";
    } else if (size < 1024 * 500) {
      return (size / 1024).toFixed(2) + " KiB";
    } else if (size < 1024 * 1024 * 500) {
      return (size / 1024 / 1024).toFixed(2) + " MiB";
    } else {
      return (size / 1024 / 1024 / 1024).toFixed(2) + " GiB";
    }
  }

  export async function getFileNames(
    noteId: string,
    getSize: boolean
  ): Promise<Array<string>> {
    let pageNum = 1;
    let files = [];

    do {
      try {
        var resources = await joplin.data.get(["notes", noteId, "resources"], {
          fields: "id, size, title",
          limit: 50,
          page: pageNum++,
          sort: "title ASC",
        });
      } catch (e) {
        console.error("getFileNames " + e);
        return files;
      }
      for (const resource of resources.items) {
        let size = await noteoverview.humanFrendlyStorageSize(resource.size);
        files.push(resource.title + (getSize === true ? " - " + size : ""));
      }
    } while (resources.has_more);
    return files;
  }

  export async function getToDoStatus(
    todo_due: number,
    todo_completed: number
  ) {
    const now = new Date();
    if (todo_completed === 0 && todo_due !== 0 && todo_due < now.getTime())
      return "todo_overdue";
    else if (todo_completed !== 0) return "todo_done";
    else if (todo_completed === 0) return "todo_open";
    else return "";
  }

  export async function getDefaultToDoStatusText(): Promise<Object> {
    let status = {
      todo_overdue: "",
      todo_open: "",
      todo_done: "",
    };
    status["todo_overdue"] = await joplin.settings.value("todoStatusOverdue");
    status["todo_open"] = await joplin.settings.value("todoStatusOpen");
    status["todo_done"] = await joplin.settings.value("todoStatusDone");

    return status;
  }
}
