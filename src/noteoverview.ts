import * as moment from "moment";
import joplin from "api";
import * as naturalCompare from "string-natural-compare";
import * as YAML from "yaml";
import * as remark from "remark";
import * as strip from "strip-markdown";
import { settings } from "./settings";
import { MenuItemLocation } from "api/types";
import { mergeObject } from "./helper";
import logging from "electron-log";
import * as path from "path";
import { OverviewOptions } from "./type";
import * as fs from "fs-extra";

let noteoverviewDialog = null;
let timer = null;
let globalSettings: any = {};
const consoleLogLevel = "verbose";
let firstSyncCompleted = false;
let joplinNotebooks: any = null;
let logFile = null;

export namespace noteoverview {
  export async function getImageNr(
    body: string,
    imagrNr: number,
    imageSettings: Object
  ): Promise<string> {
    logging.verbose("func: getImageNr");
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
        logging.error("getTags " + e);
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

    // Replace search with original search
    noteoverviewSettings["search"] = noteoverviewSettings["searchWithVars"];
    console.log(noteoverviewSettings);
    delete noteoverviewSettings["searchWithVars"];

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
    logging.verbose("func: getToDoDateColor");
    const now = new Date();
    let colorType = "";

    if (todo_due === 0 && todo_completed === 0) {
      // ToDo open no due date
      colorType = "open_nodue";
    } else if (todo_due === 0 && todo_completed !== 0) {
      // ToDo done no due date
      colorType = "done_nodue";
    } else if (
      todo_due > now.getTime() &&
      todo_completed === 0 &&
      coloring["todo"]["warningHours"] !== 0 &&
      todo_due - 3600 * coloring["todo"]["warningHours"] * 1000 < now.getTime()
    ) {
      // ToDo open and in warning time
      colorType = "warning";
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
        warning: await joplin.settings.value("colorTodoWarning"),
        warningHours: await joplin.settings.value("todoWarningHours"),
        open_overdue: await joplin.settings.value("colorTodoOpenOverdue"),
        done: await joplin.settings.value("colorTodoDone"),
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
        logging.error("getFileNames " + e);
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
    logging.verbose("func: getToDoStatus");
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
    const excerptRegex =
      excerptSettings && excerptSettings.hasOwnProperty("regex")
        ? excerptSettings["regex"]
        : false;
    const excerptRegexFlags =
      excerptSettings && excerptSettings.hasOwnProperty("regexflags")
        ? excerptSettings["regexflags"]
        : false;
    const removeMd =
      excerptSettings && excerptSettings.hasOwnProperty("removemd")
        ? excerptSettings["removemd"]
        : true;
    const imageName =
      excerptSettings && excerptSettings.hasOwnProperty("imagename")
        ? excerptSettings["imagename"]
        : false;
    const removeNewLine =
      excerptSettings && excerptSettings.hasOwnProperty("removenewline")
        ? excerptSettings["removenewline"]
        : true;
    let contentText = markdown;

    let excerpt = "";

    if (excerptRegex !== false) {
      let matchRegex = null;
      if (excerptRegexFlags !== false) {
        matchRegex = new RegExp(excerptRegex, excerptRegexFlags);
      } else {
        matchRegex = new RegExp(excerptRegex);
      }

      const hits = markdown.match(matchRegex);
      const excerptArray = [];
      if (hits == null) return "";

      for (let match of hits) {
        excerptArray.push(match);
      }
      excerpt = await cleanExcerpt(
        excerptArray.join("\n"),
        removeMd,
        imageName,
        removeNewLine
      );
      return excerpt;
    } else {
      contentText = await cleanExcerpt(
        contentText,
        removeMd,
        imageName,
        removeNewLine
      );
      excerpt = contentText.slice(0, maxExcerptLength);

      if (contentText.length > maxExcerptLength) {
        return excerpt + "...";
      }

      return excerpt;
    }
  }

  export async function cleanExcerpt(
    content: string,
    removeMd: boolean,
    imageName: boolean,
    removeNewLine: boolean
  ): Promise<string> {
    if (imageName === false) {
      content = content.replace(/(!\[)([^\]]+)(\]\([^\)]+\))/g, "$1$3");
    }
    if (removeMd === true) {
      let processedMd = remark().use(strip).processSync(content);
      content = processedMd["contents"].toString();
      content = content.substring(0, content.length - 1);
      content = content.replace(/(\s\\?~~|~~\s)/g, " ");
      content = content.replace(/(\s\\?==|==\s)/g, " ");
      content = content.replace(/(\s\\?\+\+|\+\+\s)/g, " ");
    }

    // Trim and normalize whitespace in content text
    if (removeNewLine === false) {
      content = content.trim().replace(/(\t| )+/g, " ");
    } else {
      content = content.trim().replace(/\s+/g, " ");
    }

    return content;
  }

  // Replace fields for header with alias
  export async function getHeaderFields(
    aliasStr: string,
    fields: any
  ): Promise<any> {
    let fieldAlias = {};
    if (aliasStr.trim() !== "") {
      aliasStr = aliasStr.replace(/ AS /gi, " AS ");
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

  export async function getNotebookName(id): Promise<string> {
    if (joplinNotebooks[id]) {
      return joplinNotebooks[id].title;
    } else {
      return "n/a";
    }
  }

  export async function getNotebookBreadcrumb(id): Promise<string> {
    if (joplinNotebooks[id]) {
      return joplinNotebooks[id].path.join(" > ");
    } else {
      return "n/a";
    }
  }

  export async function loadNotebooks(reload = false) {
    logging.verbose("Func: loadNotebooks");
    if (reload === true || joplinNotebooks === null) {
      logging.verbose("load notebooks");
      joplinNotebooks = {};
      let queryFolders;
      let pageQuery = 1;
      do {
        try {
          queryFolders = await joplin.data.get(["folders"], {
            fields: "id, parent_id, title",
            limit: 50,
            page: pageQuery++,
          });
        } catch (error) {
          logging.error(error.message);
        }

        for (let queryFolderKey in queryFolders.items) {
          const id = queryFolders.items[queryFolderKey].id;
          joplinNotebooks[id] = {
            id: id,
            title: queryFolders.items[queryFolderKey].title,
            parent_id: queryFolders.items[queryFolderKey].parent_id,
          };
        }
      } while (queryFolders.has_more);

      const getParentName = (id: string, notebookPath: string[]) => {
        if (id === "") return;
        if (joplinNotebooks[id]) {
          // To avoid orphan notebooks
          if (joplinNotebooks[id].parent_id !== "") {
            getParentName(joplinNotebooks[id].parent_id, notebookPath);
          }
          notebookPath.push(joplinNotebooks[id].title);
        }
      };

      for (const key in joplinNotebooks) {
        const notebookPath: string[] = [];
        getParentName(joplinNotebooks[key].parent_id, notebookPath);
        notebookPath.push(joplinNotebooks[key].title);
        joplinNotebooks[key].path = notebookPath;
      }
    }
  }

  // Calculate notes size including resources
  export async function getNoteSize(noteId): Promise<string> {
    let size = 0;

    try {
      var note = await joplin.data.get(["notes", noteId], {
        fields: "id, body",
      });
    } catch (e) {
      logging.error("getNoteSize " + e);
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
        logging.error("getNoteSize resources " + e);
        return "n/a";
      }

      for (const resource of resources.items) {
        size += Number.parseInt(resource.size);
      }
    } while (resources.has_more);

    return await noteoverview.humanFrendlyStorageSize(size);
  }

  export async function updateNoteBody(
    newBodyStr: string,
    noteId: string,
    userTriggerd: boolean
  ) {
    logging.info("Update note: " + noteId);
    const slectedNote = await joplin.workspace.selectedNote();
    const codeView = await joplin.settings.globalValue("editor.codeView");
    const noteVisiblePanes = await joplin.settings.globalValue(
      "noteVisiblePanes"
    );

    // Update actual note only when in viewer mode (rich text editor delete HTML comments) or user triggerd
    // Issue #13
    if (
      slectedNote.id === noteId &&
      codeView === true &&
      (noteVisiblePanes === "viewer" || userTriggerd === true)
    ) {
      logging.verbose("   Use replaceSelection");
      await joplin.commands.execute("textSelectAll");
      await joplin.commands.execute("replaceSelection", newBodyStr);
    } else if (slectedNote.id !== noteId) {
      logging.verbose("   Use API");
      await joplin.data.put(["notes", noteId], null, {
        body: newBodyStr,
      });
    } else {
      logging.verbose("   skipping");
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
    globalSettings = {};
    globalSettings.dateFormat = await joplin.settings.globalValue("dateFormat");
    globalSettings.timeFormat = await joplin.settings.globalValue("timeFormat");
    globalSettings.statusText = await noteoverview.getDefaultStatusText();
    globalSettings.coloring = await noteoverview.getDefaultColoring();
    const showNoteCount = await joplin.settings.value("showNoteCount");
    if (showNoteCount !== "off") {
      globalSettings.showNoteCount = {
        enable: true,
        position: showNoteCount,
        text: await joplin.settings.value("showNoteCountText"),
      };
    } else {
      globalSettings.showNoteCount = { enable: false };
    }
  }

  export async function updateAll(userTriggerd: boolean) {
    logging.info("check all overviews");
    await noteoverview.loadGlobalSettings();
    await noteoverview.loadNotebooks(true);

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
        await noteoverview.update(noteId, userTriggerd);
      }
    } while (overviewNotes.has_more);
    logging.info("all overviews checked");
  }

  export async function validateExcerptRegEx(
    settings: any,
    title: string
  ): Promise<Boolean> {
    // Validate excerpt regex match
    if (
      settings.hasOwnProperty("excerpt") &&
      settings["excerpt"].hasOwnProperty("regexp")
    ) {
      const flags =
        settings &&
        settings.hasOwnProperty("excerpt") &&
        settings["excerpt"].hasOwnProperty("regexflags")
          ? settings["excerpt"]["regexflags"]
          : false;
      try {
        if (flags !== false) new RegExp(settings["excerpt"]["regex"], flags);
        else new RegExp(settings["excerpt"]["regex"]);
      } catch (error) {
        logging.error("RegEx parse error: " + error.message);
        await noteoverview.showError(
          title,
          "RegEx parse error</br>" + error.message,
          settings["excerpt"]["regex"]
        );
        return false;
      }
    }
    return true;
  }

  export async function update(noteId: string, userTriggerd: boolean) {
    const note = await joplin.data.get(["notes", noteId], {
      fields: ["id", "title", "body"],
    });
    logging.info(`check note: ${note.title} (${note.id})`);

    // Search all note-overview blocks in note
    const noteOverviewRegEx =
      /(?<!```\n)(?<!``` \n)(<!--\s?note-overview-plugin(?<settings>[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?note-overview-plugin)|$)/gi;
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
        logging.error("YAML parse error: " + error.message);
        await noteoverview.showError(
          note.title,
          "YAML parse error</br>" + error.message,
          settingsBlock
        );
        return;
      }

      if (
        (await validateExcerptRegEx(noteOverviewSettings, note.title)) === false
      ) {
        return;
      }

      noteOverviewSettings["searchWithVars"] = noteOverviewSettings["search"];
      noteOverviewSettings["search"] = await noteoverview.replaceSearchVars(
        noteOverviewSettings["search"]
      );

      logging.verbose("Search: " + noteOverviewSettings["search"]);
      logging.verbose(
        "Search with vars: " + noteOverviewSettings["searchWithVars"]
      );

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

      if (regExMatch[4] === "<!--endoverview-->") {
        startOrgTextIndex = endIndex;
      } else {
        startOrgTextIndex = startIndex + regExMatch[1].length;
      }

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
          note.body.length,
          true
        )
      );
    }

    // Update note?
    const newNoteBodyStr = newNoteBody.join("\n");
    if (note.body != newNoteBodyStr) {
      await noteoverview.updateNoteBody(newNoteBodyStr, note.id, userTriggerd);
    }
  }

  export async function getOptions(
    overviewSettings: any
  ): Promise<OverviewOptions> {
    logging.verbose("func: getOptions");
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

    settings.details = overviewSettings["details"]
      ? overviewSettings["details"]
      : null;

    settings.count = await mergeObject(
      globalSettings.showNoteCount,
      overviewSettings["count"] ? overviewSettings["count"] : null
    );

    settings.listview = overviewSettings["listview"]
      ? overviewSettings["listview"]
      : null;

    settings.link = overviewSettings["link"] ? overviewSettings["link"] : null;

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

    if (fields.includes("link")) {
      additionalFields.push("source_url");
    }

    return additionalFields;
  }

  export async function getOverviewContent(
    noteId: string,
    noteTitle: string,
    overviewSettings: any
  ): Promise<string[]> {
    logging.verbose("func: getOverviewContent");
    const query: string = overviewSettings["search"];
    let overviewContent: string[] = [];

    if (query) {
      const options = await noteoverview.getOptions(overviewSettings);

      // create array from fields
      let fields = [];
      if (options.fields) {
        fields = options.fields.toLowerCase().replace(/\s/g, "").split(",");
      } else {
        fields = ["updated_time", "title"];
      }

      // Field alias for header
      const headerFields = await noteoverview.getHeaderFields(options.alias, [
        ...fields,
      ]);

      // Remove virtual fields from dbFieldsArray
      let dbFieldsArray = [...fields];
      dbFieldsArray = dbFieldsArray.filter(
        (el) =>
          [
            "notebook",
            "breadcrumb",
            "tags",
            "size",
            "file",
            "file_size",
            "status",
            "image",
            "excerpt",
            "link",
          ].indexOf(el) === -1
      );

      dbFieldsArray = [
        ...dbFieldsArray,
        ...(await noteoverview.getAdditionalFields(fields)),
      ];

      let noteCount = 0;
      let queryNotes = null;
      let pageQueryNotes = 1;
      const entrys: string[] = [];
      do {
        try {
          queryNotes = await joplin.data.get(["search"], {
            query: query,
            fields: "id, parent_id, " + dbFieldsArray.join(","),
            order_by: options.orderBy,
            order_dir: options.orderDir.toUpperCase(),
            limit: 50,
            page: pageQueryNotes++,
          });
        } catch (error) {
          logging.error(error.message);
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

            if (options.listview) {
              entrys.push(
                await noteoverview.getNoteInfoAsListView(
                  queryNotes.items[queryNotesKey],
                  options
                )
              );
            } else {
              entrys.push(
                await noteoverview.getNoteInfoAsTable(
                  fields,
                  queryNotes.items[queryNotesKey],
                  options
                )
              );
            }
          }
        }
      } while (queryNotes.has_more);

      if (options.listview) {
        if (options.listview.separator) {
          for (let index = 0; index < entrys.length - 1; index++) {
            entrys[index] += options.listview.separator;
          }
        }

        if (options.listview.prefix) entrys.unshift(options.listview.prefix);
        if (options.listview.suffix) entrys.push(options.listview.suffix);

        if (options.listview.linebreak === false) {
          overviewContent.push(entrys.join(""));
        } else {
          overviewContent = entrys;
        }
      } else {
        overviewContent = [
          ...(await noteoverview.getTableHeader(headerFields)),
          ...entrys,
        ];
      }

      await addNoteCount(overviewContent, noteCount, options);

      await addHTMLDetailsTag(overviewContent, noteCount, options);
    }

    overviewContent.unshift(
      await noteoverview.createSettingsBlock(overviewSettings)
    );
    overviewContent.push("<!--endoverview-->");

    return overviewContent;
  }

  export async function addHTMLDetailsTag(
    overview: string[],
    noteCount: number,
    options: OverviewOptions
  ) {
    if (options.details) {
      overview.unshift("");
      if (options.details.summary) {
        const summary = options.details.summary.replace(
          "{{count}}",
          noteCount.toString()
        );
        overview.unshift(`<summary>${summary}</summary>`);
      }
      overview.unshift(
        `<details ` + (options.details.open === true ? ` open` : `close`) + `>`
      );

      overview.push("</details>");
    }
  }

  export async function addNoteCount(
    overview: string[],
    count: number,
    options: OverviewOptions
  ) {
    if (
      options.count &&
      (options.count.enable || options.count.enable !== false)
    ) {
      const text =
        options.count.text && options.count.text !== ""
          ? `${options.count.text} `
          : ``;

      const countStr = text.replace("{{count}}", count.toString());

      if (options.count.position === "above") {
        if (options.listview) overview.unshift("");
        overview.unshift(countStr);
      } else {
        if (options.listview) overview.push("");
        overview.push(countStr);
      }
    }
  }

  export async function replaceFieldPlaceholder(
    text: string,
    noteFields: string[],
    options: OverviewOptions
  ): Promise<string> {
    // asyncStringReplace copied from https://dev.to/ycmjason/stringprototypereplace-asynchronously-28k9
    const asyncStringReplace = async (
      str: string,
      regex: RegExp,
      aReplacer: any
    ) => {
      const substrs = [];
      let match;
      let i = 0;
      while ((match = regex.exec(str)) !== null) {
        substrs.push(str.slice(i, match.index));
        substrs.push(aReplacer(...match));
        i = regex.lastIndex;
      }
      substrs.push(str.slice(i));
      return (await Promise.all(substrs)).join("");
    };

    try {
      return await asyncStringReplace(
        text,
        /{{([^}]+)}}/g,
        async (match, groups) => {
          return await noteoverview.getFieldValue(groups, noteFields, options);
        }
      );
    } catch (error) {
      logging.error(error.message);
      await noteoverview.showError("", error.message, "");
      throw error;
    }
  }

  export async function getTableHeader(header: string[]) {
    const mdTableHeader: string[] = [];
    mdTableHeader.push("| " + header.join(" | ") + " |");
    mdTableHeader.push("|" + " --- |".repeat(header.length));

    return mdTableHeader;
  }

  export async function getNoteInfoAsListView(
    noteFields: string[],
    options: OverviewOptions
  ): Promise<string> {
    let info = options.listview.text
      ? options.listview.text
      : "[{{title}}](/:{{id}})";

    info = await noteoverview.replaceFieldPlaceholder(
      info,
      noteFields,
      options
    );

    return info;
  }

  export async function getNoteInfoAsTable(
    fields: string[],
    noteFields: string[],
    options: OverviewOptions
  ): Promise<string> {
    const info: string[] = [];
    options.escapeForTable = true;

    for (let field of fields) {
      info.push(await noteoverview.getFieldValue(field, noteFields, options));
    }

    return "|" + info.join("|") + "|";
  }

  export async function removeNoteoverviewCode(data: string): Promise<string> {
    data = data.replace(
      /(?<!```\n)(?<!``` \n)(<!--\s?note-overview-plugin([\w\W]*?)-->)/gi,
      "REMOVE_NOTOVERVIEW_LINE"
    );
    data = data.replace(
      /(<!--endoverview-->)(?!\n```)/gi,
      "REMOVE_NOTOVERVIEW_LINE"
    );

    const lines = data.split("\n");
    let newLines = [];
    for (const line of lines) {
      if (line.match("REMOVE_NOTOVERVIEW_LINE") === null) {
        newLines.push(line);
      }
    }

    return newLines.join("\n");
  }

  export async function getFieldValue(
    field: string,
    fields: any,
    options: OverviewOptions
  ): Promise<string> {
    logging.verbose("func: getFieldValue for " + field);
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
      case "todo_due":
      case "todo_completed":
        const dateObject = new Date(fields[field]);
        value = await noteoverview.getDateFormated(
          dateObject.getTime(),
          globalSettings.dateFormat,
          globalSettings.timeFormat
        );
        switch (field) {
          case "todo_due":
          case "todo_completed":
            const color = await noteoverview.getToDoDateColor(
              options.coloring,
              fields["todo_due"],
              fields["todo_completed"],
              field
            );
            if (color !== "") {
              value = `<font color="${color}">${value}</font>`;
            }
            break;
        }
        break;
      case "status":
        const status: string = await noteoverview.getToDoStatus(
          fields["todo_due"],
          fields["todo_completed"]
        );
        value = options.statusText["todo"][status];
        break;
      case "excerpt":
        value = await noteoverview.getMarkdownExcerpt(
          fields["body"],
          options.excerptSettings
        );
        break;
      case "image":
        value = await noteoverview.getImageNr(
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
      case "breadcrumb":
        value = await noteoverview.getNotebookBreadcrumb(fields["parent_id"]);
        break;
      case "link":
        const caption =
          options.link && options.link.hasOwnProperty("caption")
            ? options.link["caption"]
            : "Link";
        const htmlLink =
          options.link && options.link.hasOwnProperty("html")
            ? options.link["html"]
            : false;
        if (htmlLink) {
          value = '<a href="' + fields["source_url"] + '">' + caption + "</a>";
        } else {
          value = "[" + caption + "](" + fields["source_url"] + ")";
        }
        break;
      default:
        value = fields[field];
    }

    value = await noteoverview.removeNoteoverviewCode(value);

    if (options.escapeForTable === true) {
      value = await noteoverview.escapeForTable(value);
    }

    if (value === "") value = " ";

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

  export async function setupLogging() {
    const logFormatFile = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
    const logFormatConsole = "[{level}] {text}";
    logFile = path.join(
      await joplin.plugins.installationDir(),
      "noteoverview.log"
    );

    const levelFile = await joplin.settings.value("fileLogLevel");
    logging.transports.file.format = logFormatFile;
    logging.transports.file.level = levelFile;
    logging.transports.file.resolvePath = () => logFile;
    logging.transports.console.level = consoleLogLevel;
    logging.transports.console.format = logFormatConsole;
  }

  export async function deleteLogFile() {
    logging.verbose("Delete log file");
    if (fs.existsSync(logFile)) {
      try {
        await fs.unlinkSync(logFile);
      } catch (e) {
        logging.error("deleteLogFile: " + e.message);
      }
    }
  }

  export async function init() {
    logging.info("Note overview plugin started!");

    await settings.register();
    await noteoverview.deleteLogFile();
    await noteoverview.setupLogging();

    noteoverviewDialog = await joplin.views.dialogs.create(
      "noteoverviewDialog"
    );

    await joplin.commands.register({
      name: "createNoteOverview",
      label: "Create note overview",
      execute: async () => {
        noteoverview.updateAll(true);
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

    // Use onSyncComplete event when sync target is configured
    if (
      (await joplin.settings.globalValue("sync.target")) === 0 &&
      (await joplin.settings.value("updateInterval")) > 0
    ) {
      logging.verbose("set first update on timer");
      await noteoverview.setTimer(1);
    } else {
      logging.verbose("set update on onSyncComplete event");
      joplin.workspace.onSyncComplete(() => {
        noteoverview.updateOnSyncComplete();
      });
    }
  }

  export async function updateOnSyncComplete() {
    logging.verbose("onSyncComplete Event");
    logging.verbose(
      "updateOnSync: " + (await joplin.settings.value("updateOnSync"))
    );

    if (!firstSyncCompleted) {
      logging.verbose("firstSyncCompleted");
      firstSyncCompleted = true;
      await noteoverview.updateAll(false);
      await noteoverview.setTimer(
        await joplin.settings.value("updateInterval")
      );
    } else if ((await joplin.settings.value("updateOnSync")) === "yes") {
      await noteoverview.updateAll(false);
    }
  }

  export async function settingsChanged(event: any) {
    logging.verbose("Settings changed");

    // Update timer
    if (event.keys.indexOf("updateInterval") !== -1) {
      await noteoverview.setTimer(
        await joplin.settings.value("updateInterval")
      );
    }

    if (event.keys.indexOf("fileLogLevel") !== -1) {
      await noteoverview.setupLogging();
    }
  }

  export async function setTimer(updateInterval: number) {
    clearTimeout(timer);
    timer = null;
    if (updateInterval > 0) {
      logging.verbose("timer set to " + updateInterval);
      timer = setTimeout(noteoverview.runTimed, 1000 * 60 * updateInterval);
    } else {
      logging.verbose("timer cleared");
    }
  }

  export async function runTimed() {
    const updateInterval = await joplin.settings.value("updateInterval");
    if (updateInterval > 0) {
      logging.verbose("run timed");
      await noteoverview.updateAll(false);
      await noteoverview.setTimer(updateInterval);
    } else {
      timer = null;
    }
  }

  export async function replaceSearchVars(query: string): Promise<string> {
    logging.verbose("replaceSearchVars");
    return query.replace(/{{moments:(?<format>[^}]+)}}/g, (match, groups) => {
      let now = new Date(Date.now());

      // Modify date
      const modifyDateRegEx = /( modify:)(?<modify>.*)/;
      const modifyDate = groups.match(modifyDateRegEx);
      groups = groups.replace(modifyDateRegEx, "");
      if (modifyDate !== null) {
        let actions = [];
        if (modifyDate["groups"]["modify"].match(",") !== null) {
          actions = modifyDate["groups"]["modify"].split(",");
        } else {
          actions.push(modifyDate["groups"]["modify"]);
        }

        let momentDate = moment(now);

        for (const action of actions) {
          let add = action.substring(0, 1);
          let quantity = action.substring(1, action.length - 1);
          let type = action.substring(action.length - 1, action.length);

          try {
            if (add == "-") {
              momentDate.subtract(quantity, type);
            } else if (add == "+") {
              momentDate.add(quantity, type);
            }
          } catch (e) {
            logging.error(e);
          }
        }
        now = new Date(momentDate.valueOf());
      }

      return moment(now.getTime()).format(groups);
    });
  }
}

export { logging };
