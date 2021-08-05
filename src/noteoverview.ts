import * as moment from "moment";
import joplin from "api";
import * as naturalCompare from "string-natural-compare";
import * as YAML from "yaml";
import * as remark from "remark";
import * as strip from "strip-markdown";
import { settings } from "./settings";
import { MenuItemLocation } from "api/types";
import { mergeObject } from "./helper";

let noteoverviewDialog = null;
let timer = null;
let globalSettings: any = {};

export namespace noteoverview {
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
  export async function getTags(noteId): Promise<string[]> {
    const tagNames: string[] = [];
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

    msg.push('<div id="noteoverview">');
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
    await joplin.views.dialogs.addScript(noteoverviewDialog, "./webview.css");
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
  ): Promise<string> {
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

  export async function getDefaultColoring(): Promise<Object> {
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
      excerptSettings && excerptSettings.hasOwnProperty("maxlength")
        ? excerptSettings["maxlength"]
        : 200;
    const removeMd =
      excerptSettings && excerptSettings.hasOwnProperty("removemd")
        ? excerptSettings["removemd"]
        : true;
    const imageName =
      excerptSettings && excerptSettings.hasOwnProperty("imagename")
        ? excerptSettings["imagename"]
        : false;
    let contentText = markdown;

    if (imageName === false) {
      contentText = contentText.replace(/(!\[)([^\]]+)(\]\([^\)]+\))/g, "$1$3");
    }

    if (removeMd === true) {
      let processedMd = remark().use(strip).processSync(contentText);
      contentText = String(processedMd["contents"]);
      contentText = contentText.replace(/(\s\\?~~|~~\s)/g, " ");
      contentText = contentText.replace(/(\s\\?==|==\s)/g, " ");
      contentText = contentText.replace(/(\s\\?\+\+|\+\+\s)/g, " ");
    }

    // Trim and normalize whitespace in content text
    contentText = contentText.trim().replace(/\s+/g, " ");
    const excerpt = contentText.slice(0, maxExcerptLength);

    if (contentText.length > maxExcerptLength) {
      return excerpt + "...";
    }

    return excerpt;
  }

  // Replace fields for header with alias
  export async function getHeaderFields(
    aliasStr: string,
    fields: any
  ): Promise<any> {
    let fieldAlias = {};
    if (aliasStr.trim() !== "") {
      const aliasArry = aliasStr.trim().split(",");
      for (let field of aliasArry) {
        let alias = field.trim().split(" AS ");
        if (alias.length == 2) {
          fieldAlias[alias[0].trim()] = alias[1].trim();
        }
      }

      for (let key in fields) {
        if (fieldAlias[fields[key]] !== undefined) {
          fields[key] = fieldAlias[fields[key]];
        }
      }
    }
    return fields;
  }

  // Get the notbook title froma notebook id
  export async function getNotebookName(id): Promise<string> {
    try {
      var folder = await joplin.data.get(["folders", id], {
        fields: "title",
      });
    } catch (e) {
      console.error("getNotebookName " + e);
      return "n/a (" + id + ")";
    }
    return folder.title;
  }

  // Calculate notes size including resources
  export async function getNoteSize(noteId): Promise<string> {
    let size = 0;

    try {
      var note = await joplin.data.get(["notes", noteId], {
        fields: "id, body",
      });
    } catch (e) {
      console.error("getNoteSize " + e);
      return "n/a";
    }
    size = note.body.length;

    let pageNum = 1;
    do {
      try {
        var resources = await joplin.data.get(["notes", noteId, "resources"], {
          fields: "id, size",
          limit: 50,
          page: pageNum++,
        });
      } catch (e) {
        console.error("getNoteSize resources " + e);
        return "n/a";
      }

      for (const resource of resources.items) {
        size += Number.parseInt(resource.size);
      }
    } while (resources.has_more);

    return await noteoverview.humanFrendlyStorageSize(size);
  }

  export async function updateNote(newBodyStr: string, noteId: string) {
    let slectedNote = await joplin.workspace.selectedNote();
    const codeView = await joplin.settings.globalValue("editor.codeView");

    if (slectedNote.id == noteId && codeView === true) {
      await joplin.commands.execute("textSelectAll");
      await joplin.commands.execute("replaceSelection", newBodyStr);
    } else {
      await joplin.data.put(["notes", noteId], null, {
        body: newBodyStr,
      });
    }
  }

  export async function removeNewLineAt(
    content: string,
    begin: boolean,
    end: boolean
  ): Promise<string> {
    if (end === true) {
      if (content.charCodeAt(content.length - 1) == 10) {
        content = content.substring(0, content.length - 1);
      }
      if (content.charCodeAt(content.length - 1) == 13) {
        content = content.substring(0, content.length - 1);
      }
    }

    if (begin === true) {
      if (content.charCodeAt(0) == 10) {
        content = content.substring(1, content.length);
      }
      if (content.charCodeAt(0) == 13) {
        content = content.substring(1, content.length);
      }
    }
    return content;
  }

  export async function loadGlobalSettings() {
    globalSettings.dateFormat = await joplin.settings.globalValue("dateFormat");
    globalSettings.timeFormat = await joplin.settings.globalValue("timeFormat");
    globalSettings.statusText = await noteoverview.getDefaultStatusText();
    globalSettings.coloring = await noteoverview.getDefaultColoring();
    globalSettings.showNoteCount = await joplin.settings.value("showNoteCount");
  }

  export async function createAll() {
    console.info("check all overviews");
    await noteoverview.loadGlobalSettings();

    let pageNum = 1;
    let overviewNotes = null;
    do {
      overviewNotes = await joplin.data.get(["search"], {
        query: '/"<!-- note-overview-plugin"',
        fields: "id",
        limit: 10,
        page: pageNum++,
      });

      for (let overviewNotesKey in overviewNotes.items) {
        const noteId: string = overviewNotes.items[overviewNotesKey].id;
        noteoverview.create(noteId);
      }
    } while (overviewNotes.has_more);
  }

  export async function create(noteId: string) {
    const note = await joplin.data.get(["notes", noteId], {
      fields: ["id", "title", "body"],
    });
    console.info(`check note ${note.title} (${note.id})`);

    // Search all note-overview blocks in note
    const noteOverviewRegEx =
      /(<!--\s?note-overview-plugin(?<settings>[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?note-overview-plugin)|$)/gi;
    let regExMatch = null;
    let startOrgTextIndex = 0;
    let startIndex = 0;
    let endIndex = 0;
    let newNoteBody: string[] = [];

    while ((regExMatch = noteOverviewRegEx.exec(note.body)) != null) {
      const settingsBlock = regExMatch["groups"]["settings"];
      startIndex = regExMatch.index;
      endIndex = startIndex + regExMatch[0].length;
      let noteOverviewSettings = null;
      try {
        noteOverviewSettings = YAML.parse(settingsBlock);
      } catch (error) {
        console.error("YAML parse error: " + error.message);
        await noteoverview.showError(
          note.title,
          "YAML parse error</br>" + error.message,
          settingsBlock
        );
        return;
      }
      console.log("Search: " + noteOverviewSettings["search"]);

      // add original content before the settings block
      if (startOrgTextIndex != startIndex) {
        newNoteBody.push(
          await noteoverview.getSubNoteContent(
            note.body,
            startOrgTextIndex,
            startIndex,
            false
          )
        );
      }
      startOrgTextIndex = endIndex;

      let noteOverviewContent = await noteoverview.getOverviewContent(
        note.id,
        note.title,
        noteOverviewSettings
      );
      newNoteBody = [...newNoteBody, ...noteOverviewContent];
    }

    // Add original content after last overview block
    if (startOrgTextIndex !== note.body.length) {
      newNoteBody.push(
        await noteoverview.getSubNoteContent(
          note.body,
          startOrgTextIndex,
          startIndex,
          true
        )
      );
    }

    // Update note?
    const newNoteBodyStr = newNoteBody.join("\n");
    if (note.body != newNoteBodyStr) {
      console.info("Update note " + note.title + " (" + note.id + ")");
      await noteoverview.updateNote(newNoteBodyStr, note.id);
    }
  }

  export async function getSettingsAsObject(
    overviewSettings: any
  ): Promise<any> {
    const settings: any = {};
    settings.overview = overviewSettings;

    settings.statusText = await mergeObject(
      globalSettings.statusText,
      overviewSettings["status"] ? overviewSettings["status"] : null
    );

    settings.fields = overviewSettings["fields"]
      ? overviewSettings["fields"]
      : null;

    // field sorting information
    settings.sortStr = overviewSettings["sort"]
      ? overviewSettings["sort"]
      : "title ASC";
    const sortArray = settings.sortStr.toLowerCase().split(" ");
    if (!sortArray[1]) {
      sortArray[1] = "ASC";
    }
    settings.orderBy = sortArray[0];
    settings.orderDir = sortArray[1];

    settings.alias = overviewSettings["alias"] ? overviewSettings["alias"] : "";

    settings.imageSettings = overviewSettings["image"]
      ? overviewSettings["image"]
      : null;

    settings.excerptSettings = overviewSettings["excerpt"]
      ? overviewSettings["excerpt"]
      : null;

    settings.coloring = await mergeObject(
      globalSettings.coloring,
      overviewSettings["coloring"]
    );

    settings.noteCount = globalSettings.showNoteCount;

    return settings;
  }

  export async function getAdditionalFields(
    fields: string[]
  ): Promise<string[]> {
    const additionalFields: string[] = [];

    // if a todo field is selected, add the other one to
    if (fields.includes("todo_due")) {
      additionalFields.push("todo_completed");
    }
    if (fields.includes("todo_completed")) {
      additionalFields.push("todo_due");
    }

    // include todo fields for the status field calculation
    if (fields.includes("status")) {
      additionalFields.push("todo_due");
      additionalFields.push("todo_completed");
    }

    // include body
    if (fields.includes("image") || fields.includes("excerpt")) {
      additionalFields.push("body");
    }

    return additionalFields;
  }

  export async function getOverviewContent(
    noteId: string,
    noteTitle: string,
    overviewSettings: any
  ): Promise<string[]> {
    const query: string = overviewSettings["search"];
    let overviewContent: string[] = [];

    if (query) {
      const settings = await noteoverview.getSettingsAsObject(overviewSettings);

      // create array from fields
      let fields = [];
      if (settings.fields) {
        fields = settings.fields.toLowerCase().replace(/\s/g, "").split(",");
      } else {
        fields = ["updated_time", "title"];
      }

      // Field alias for header
      const headerFields = await noteoverview.getHeaderFields(settings.alias, [
        ...fields,
      ]);

      // Remove virtual fields from dbFieldsArray
      let dbFieldsArray = [...fields];
      dbFieldsArray = dbFieldsArray.filter(
        (el) =>
          [
            "notebook",
            "tags",
            "size",
            "file",
            "file_size",
            "status",
            "image",
            "excerpt",
          ].indexOf(el) === -1
      );

      dbFieldsArray = [
        ...dbFieldsArray,
        ...(await noteoverview.getAdditionalFields(fields)),
      ];

      overviewContent = await noteoverview.getTableHeader(headerFields);

      let noteCount = 0;
      let queryNotes = null;
      let pageQueryNotes = 1;
      do {
        try {
          queryNotes = await joplin.data.get(["search"], {
            query: query,
            fields: "id, parent_id, " + dbFieldsArray.join(","),
            order_by: settings.orderBy,
            order_dir: settings.orderDir.toUpperCase(),
            limit: 50,
            page: pageQueryNotes++,
          });
        } catch (error) {
          console.error(error.message);
          let errorMsg = error.message;
          errorMsg = errorMsg.replace(/(.*)(:\sSELECT.*)/g, "$1");

          await noteoverview.showError(noteTitle, errorMsg, "");
          let settingsOnly: string[] = [];
          settingsOnly.unshift(
            await noteoverview.createSettingsBlock(overviewSettings)
          );
          return settingsOnly;
        }

        for (let queryNotesKey in queryNotes.items) {
          if (queryNotes.items[queryNotesKey].id != noteId) {
            noteCount++;

            overviewContent.push(
              await noteoverview.getNoteInfoAsTable(
                fields,
                queryNotes.items[queryNotesKey],
                settings
              )
            );
          }
        }
      } while (queryNotes.has_more);

      if (settings.noteCount == "below") {
        overviewContent.push("Note count: " + noteCount);
      } else if (settings.noteCount == "above") {
        overviewContent.unshift("Note count: " + noteCount);
      }
    }

    overviewContent.unshift(
      await noteoverview.createSettingsBlock(overviewSettings)
    );
    overviewContent.push("<!--endoverview-->");

    return overviewContent;
  }

  export async function getTableHeader(header: string[]) {
    const mdTableHeader: string[] = [];
    mdTableHeader.push("| " + header.join(" | ") + " |");
    mdTableHeader.push("|" + " --- |".repeat(header.length));

    return mdTableHeader;
  }

  export async function getNoteInfoAsTable(
    fields: string[],
    noteFields: string[],
    settings: any
  ): Promise<string> {
    const info: string[] = [];
    settings.escapeForTable = true;

    for (let field of fields) {
      info.push(await noteoverview.getFieldValue(field, noteFields, settings));
    }

    return "|" + info.join("|") + "|";
  }

  export async function getFieldValue(
    field: string,
    fields: any,
    options: any
  ): Promise<string> {
    let value = "";
    switch (field) {
      case "title":
        value = `[${fields.title}](:/${fields.id})`;
        break;
      case "created_time":
      case "updated_time":
      case "user_created_time":
      case "user_updated_time":
      case "todo_due":
      case "todo_completed":
        const dateObject = new Date(fields[field]);
        value = await noteoverview.getDateFormated(
          dateObject.getTime(),
          globalSettings.dateFormat,
          globalSettings.timeFormat
        );
      case "todo_due":
      case "todo_completed":
        const color = await noteoverview.getToDoDateColor(
          options.coloring,
          fields["todo_due"],
          fields["todo_completed"],
          fields[field]
        );
        if (color !== "") {
          value = `<font color="${color}">${value}</font>`;
        }
        break;
      case "status":
        const status: string = await noteoverview.getToDoStatus(
          fields["todo_due"],
          fields["todo_completed"]
        );
        value = options.statusTexts["todo"][status];
        break;
      case "excerpt":
        value = await noteoverview.getMarkdownExcerpt(
          fields["body"],
          options.excerptSettings
        );
        break;
      case "image":
        await noteoverview.getImageNr(
          fields["body"],
          options.imageSettings && options.imageSettings["nr"]
            ? options.imageSettings["nr"]
            : 1,
          options.imageSettings
        );
        break;
      case "file":
        value = (await noteoverview.getFileNames(fields["id"], false)).join(
          "<br>"
        );
        break;
      case "file_size":
        value = (await noteoverview.getFileNames(fields["id"], true)).join(
          "<br>"
        );
        break;
      case "size":
        value = await noteoverview.getNoteSize(fields["id"]);
        break;
      case "tags":
        value = (await noteoverview.getTags(fields["id"])).join(", ");
        break;
      case "notebook":
        value = await noteoverview.getNotebookName(fields["parent_id"]);
        break;
      default:
        value = fields[field];
    }

    if (options.escapeForTable === true) {
      value = await noteoverview.escapeForTable(value);
    }

    return value;
  }

  export async function getSubNoteContent(
    body: string,
    fromIndex: number,
    toIndex: number,
    posIsAfterOverviewSection: boolean
  ) {
    const orgContent = body.substring(fromIndex, toIndex);
    let stripe: boolean[];

    if (posIsAfterOverviewSection === false) {
      if (fromIndex === 0) {
        stripe = [false, true];
      } else {
        stripe = [true, true];
      }
    } else {
      stripe = [true, false];
    }

    return await noteoverview.removeNewLineAt(orgContent, stripe[0], stripe[1]);
  }

  export async function init() {
    console.info("Note overview plugin started!");

    await settings.register();

    noteoverviewDialog = await joplin.views.dialogs.create(
      "noteoverviewDialog"
    );

    await joplin.commands.register({
      name: "createNoteOverview",
      label: "Create note overview",
      execute: async () => {
        noteoverview.createAll();
      },
    });

    await joplin.views.menuItems.create(
      "menuItemToolsCreateNoteOverview",
      "createNoteOverview",
      MenuItemLocation.Tools
    );

    joplin.settings.onChange(async (event: any) => {
      await noteoverview.settingsChanged(event);
    });

    if ((await joplin.settings.value("updateInterval")) > 0) {
      // ToDo: use sync finish trigger
      await noteoverview.setTimer(5);
    }
  }

  export async function settingsChanged(event: any) {
    console.log("Settings changed");

    // Update timer
    if (event.keys.indexOf("updateInterval") !== -1) {
      await noteoverview.setTimer(
        await joplin.settings.value("updateInterval")
      );
    }
  }

  export async function setTimer(updateInterval: number) {
    clearTimeout(timer);
    timer = null;
    if (updateInterval > 0) {
      timer = setTimeout(noteoverview.runTimed, 1000 * 60 * updateInterval);
    } else {
      console.log("timer cleared");
    }
  }

  export async function runTimed() {
    const updateInterval = await joplin.settings.value("updateInterval");
    if (updateInterval > 0) {
      console.log("run timed");
      await noteoverview.createAll();
      await noteoverview.setTimer(updateInterval);
    } else {
      timer = null;
    }
  }
}
