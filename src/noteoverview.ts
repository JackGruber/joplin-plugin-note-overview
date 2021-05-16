import * as moment from "moment";
import joplin from "api";
import * as naturalCompare from "string-natural-compare";
import * as YAML from "yaml";
import * as remark from "remark";
import * as strip from "strip-markdown";

let noteoverviewDialog = null;

export namespace noteoverview {
  export async function setDialog(dialog) {
    noteoverviewDialog = dialog;
  }

  export async function getImageNr(
    body: string,
    imagrNr: number,
    imageSettings: Object
  ): Promise<string> {
    const regExresourceId = /!\[([^\]]+|)\]\(:\/(?<resourceId>[\da-z]{32})\)/g;
    let ids = [];
    let imageId = null;
    let regExMatch = null;
    while ((regExMatch = regExresourceId.exec(body)) != null) {
      ids.push(regExMatch["groups"]["resourceId"]);
    }

    const exactnr =
      imageSettings && imageSettings.hasOwnProperty("exactnr")
        ? imageSettings["exactnr"]
        : true;
    const width =
      imageSettings && imageSettings.hasOwnProperty("width")
        ? imageSettings["width"]
        : "200";
    const height =
      imageSettings && imageSettings.hasOwnProperty("height")
        ? imageSettings["height"]
        : "200";

    if (ids) {
      if (ids.length >= imagrNr) {
        imageId = ids[imagrNr - 1];
      } else if (exactnr === false) {
        imageId = ids[ids.length - 1];
      }

      if (imageId) {
        if (width != "" || height != "") {
          return (
            "<img src=':/" +
            imageId +
            "' width='" +
            width +
            "' height='" +
            height +
            "'>"
          );
        } else {
          return "![](:/" + imageId + ")";
        }
      }
    }

    return "";
  }

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
      return naturalCompare(a, b, { caseInsensitive: true });
    });

    return tagNames;
  }

  export async function createSettingsBlock(
    noteoverviewSettings: object
  ): Promise<string> {
    let settingsBlock = [];
    const yamlBlock = YAML.stringify(noteoverviewSettings);
    settingsBlock.push("<!-- note-overview-plugin");
    settingsBlock.push(yamlBlock.substring(0, yamlBlock.length - 1));
    settingsBlock.push("-->");
    return settingsBlock.join("\n");
  }

  export async function showError(
    noteTitle: string,
    info: string = null,
    noteoverviewSettings: string = null
  ) {
    await joplin.views.dialogs.setButtons(noteoverviewDialog, [{ id: "ok" }]);
    let msg = [];

    msg.push('<div style="overflow-wrap: break-word;">');
    msg.push("<h3>Noteoverview error</h3>");
    msg.push("<p><b>Note:</b>");
    msg.push(noteTitle);
    msg.push("</p>");

    if (info) {
      msg.push("<p>");
      msg.push(info);
      msg.push("</p>");
    }

    if (noteoverviewSettings) {
      msg.push("<div>");
      msg.push(
        noteoverviewSettings.replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;")
      );
      msg.push("</div>");
    }

    msg.push("</div>");

    await joplin.views.dialogs.setHtml(noteoverviewDialog, msg.join("\n"));
    await joplin.views.dialogs.open(noteoverviewDialog);
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

    let color = coloring["todo"][colorType];
    if (color.indexOf(";") !== -1) {
      color = color.split(";");
    } else if (color.indexOf(",") !== -1) {
      color = color.split(",");
    } else {
      color = [color, color];
    }

    if (type === "todo_due") return color[0];
    else if (type === "todo_completed") return color[1];
    else return "";
  }

  export async function getDefaultColors(): Promise<Object> {
    let coloring = {
      todo: {
        open_nodue: "",
        open: await joplin.settings.value("colorTodoOpen"),
        open_overdue: await joplin.settings.value("colorTodoOpenOverdue"),
        done: await joplin.settings.value("colorTodoOpenOverdue"),
        done_overdue: await joplin.settings.value("colorTodoDoneOverdue"),
        done_nodue: await joplin.settings.value("colorTodoDoneNodue"),
      },
    };

    return coloring;
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
      return "overdue";
    else if (todo_completed !== 0) return "done";
    else if (todo_completed === 0) return "open";
    else return "";
  }

  export async function getDefaultStatusText(): Promise<Object> {
    let status = {
      todo: {
        overdue: await joplin.settings.value("todoStatusOverdue"),
        open: await joplin.settings.value("todoStatusOpen"),
        done: await joplin.settings.value("todoStatusDone"),
      },
    };

    return status;
  }

  export async function getMarkdownExcerpt(
    markdown: string,
    excerptSettings: Object
  ): Promise<string> {
    const maxExcerptLength =
      excerptSettings && excerptSettings.hasOwnProperty("maxLength")
        ? excerptSettings["maxLength"]
        : 50;
    const removeMd =
      excerptSettings && excerptSettings.hasOwnProperty("removeMd")
        ? excerptSettings["removeMd"]
        : true;

    let contentText = markdown;

    if (removeMd === true) {
      let processedMd = remark().use(strip).processSync(markdown);
      contentText = String(processedMd["contents"]);
      contentText = contentText.replace(/(\s\\~~|~~\s)/g, "");
      contentText = contentText.replace(/(\s\\==|==\s)/g, "");
      contentText = contentText.replace(/(\s\\\+\+|\+\+\s)/g, "");
    }

    // Trim and normalize whitespace in content text
    contentText = contentText.trim().replace(/\s+/g, " ");
    const excerpt = contentText.slice(0, maxExcerptLength);

    if (contentText.length > maxExcerptLength) {
      return excerpt + "...";
    }

    return excerpt;
  }
}
