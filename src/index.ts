import joplin from "api";
import { MenuItemLocation, SettingItemType } from "api/types";

const moment = require("moment");

let timer = null;

joplin.plugins.register({
  onStart: async function () {
    console.info("Note overview plugin started!");

    await joplin.settings.registerSection("noteOverviewSection", {
      label: "Note overview",
      iconName: "fas fa-binoculars",
    });

    await joplin.settings.registerSetting("updateInterval", {
      value: 5,
      minimum: 0,
      maximum: 2880,
      type: SettingItemType.Int,
      section: "noteOverviewSection",
      public: true,
      label: "Update interval in minutes",
      description: "0 = disable automatic note overview creation",
    });

    await joplin.settings.registerSetting("showNoteCount", {
      value: "Off",
      type: SettingItemType.String,
      section: "noteOverviewSection",
      isEnum: true,
      public: true,
      label: "Show note count",
      options: {
        false: "Off",
        above: "Above",
        below: "Below",
      },
    });

    const noteoverviewDialog = await joplin.views.dialogs.create(
      "noteoverviewDialog"
    );

    await joplin.commands.register({
      name: "createNoteOverview",
      label: "Create note overview",
      execute: async () => {
        runCreateNoteOverview();
      },
    });

    await joplin.views.menuItems.create(
      "menuItemToolsCreateNoteOverview",
      "createNoteOverview",
      MenuItemLocation.Tools
    );

    joplin.settings.onChange(async (event: any) => {
      console.log("Settings changed");
      // Update timer
      if (event.keys.indexOf != -1) {
        if (timer != null) {
          console.log("Clear timer");
          clearTimeout(timer);
        }
        await runTimedNoteOverview();
      }
    });

    // Update note and reset timer
    async function runTimedNoteOverview() {
      const updateInterval = await joplin.settings.value("updateInterval");
      if (updateInterval > 0) {
        console.info("Set timer");
        await runCreateNoteOverview();
        timer = window.setTimeout(
          runTimedNoteOverview,
          1000 * 60 * updateInterval
        );
      } else {
        timer = null;
      }
    }

    async function runCreateNoteOverview() {
      console.info("Run create note overview");
      // search all notes
      let pageNum = 1;
      let overviewNotes = null;
      let queryNotes = null;

      do {
        overviewNotes = await joplin.data.get(["search"], {
          query: '/"<!-- note-overview-plugin"',
          fields: "id, title, body",
          limit: 10,
          page: pageNum++,
        });

        for (let overviewNotesKey in overviewNotes.items) {
          let noteBody = overviewNotes.items[overviewNotesKey].body;
          let noteId = overviewNotes.items[overviewNotesKey].id;
          let noteTitle = overviewNotes.items[overviewNotesKey].title;
          let newBody = [];
          let orgContent = null;
          console.info("Check note " + noteTitle + " (" + noteId + ")");
          
          // Search all note-overview blocks in note
          const noteOverviewRegEx = /(<!--\s?note-overview-plugin(?:[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?note-overview-plugin)|$)/gi;
          let regExMatch = null;
          let startOrgTextIndex = 0;
          let startIndex = 0;
          let endIndex = 0;
          while ((regExMatch = noteOverviewRegEx.exec(noteBody)) != null) {
            let settingsBlock = regExMatch[1];
            startIndex = regExMatch.index;
            endIndex = startIndex + regExMatch[0].length;

            // add original conten before the settings block
            if (startOrgTextIndex != startIndex) {
              orgContent = noteBody.substring(startOrgTextIndex, startIndex);
              if(startOrgTextIndex == 0) {
                orgContent = await removeNewLineAt(orgContent, false, true);
              } else {
                orgContent = await removeNewLineAt(orgContent, true, true);
              }

              newBody.push(orgContent);
            }
            startOrgTextIndex = endIndex;

            let noteOverviewContent = await getNoteOverviewContent(noteId, noteTitle, settingsBlock);
            newBody = [...newBody, ...noteOverviewContent];
          }

          // Add original content after last overview block
          if (startOrgTextIndex !== noteBody.length) {
            orgContent = noteBody.substring(startOrgTextIndex, noteBody.length);
            orgContent = await removeNewLineAt(orgContent, true, false);
            newBody.push(orgContent);
          }

          // Note update needed?
          let newBodyStr = newBody.join("\n");
          if (noteBody != newBodyStr) {
            console.info("Update note " + noteTitle + " (" + noteId + ")");
            await updateNote(newBodyStr, noteId);
          }
        }
      } while (overviewNotes.has_more);
    }

    async function removeNewLineAt(content: string, begin: boolean, end: boolean): Promise<string> {
      if (end === true) {
        if(content.charCodeAt(content.length-1) == 10) {
          content = content.substring(0, content.length -1);
        }
        if(content.charCodeAt(content.length-1) == 13) {
          content = content.substring(0, content.length -1);
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

    // Search notes from query and return content
    async function getNoteOverviewContent(noteId: string, noteTitle: string, settingsBlock: string): Promise<any> {
      const now = new Date();
      const dateFormat = await joplin.settings.globalValue("dateFormat");
      const timeFormat = await joplin.settings.globalValue("timeFormat");

      let query: string = await getParameter(settingsBlock, "search", null);
      let fields: string = await getParameter(settingsBlock, "fields", null);
      let sort: string = await getParameter(settingsBlock, "sort", "title ASC");
      const alias: string = await getParameter(settingsBlock, "alias", "");

      // create array from fields
      let fieldsArray = [];
      if (fields) {
        fieldsArray = fields.toLowerCase().replace(/\s/g, "").split(",");
      } else {
        fieldsArray = ["updated_time", "title"];
      }

      let newBody = [];

      if (query) {
        // field sorting information
        let sortArray = sort.toLowerCase().split(" ");
        if (!sortArray[1]) {
          sortArray[1] = "ASC";
        }

        // Field alias for header
        const headerFields = await getHeaderFields(alias, [...fieldsArray]);

        // Remove virtual fields from dbFieldsArray
        let dbFieldsArray = [...fieldsArray];
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "notebook");
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "tags");
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "size");

        let noteCount = 0;
        let queryNotes = null;
        let pageQueryNotes = 1;

        newBody.push("| " + headerFields.join(" | ") + " |");
        newBody.push("|" + " --- |".repeat(fieldsArray.length));

        do {
          try {
            queryNotes = await joplin.data.get(["search"], {
              query: query,
              fields: "id, parent_id, " + dbFieldsArray.join(","),
              order_by: sortArray[0],
              order_dir: sortArray[1].toUpperCase(),
              limit: 50,
              page: pageQueryNotes++,
            });
          } catch (e) {
            await joplin.views.dialogs.setButtons(noteoverviewDialog, [
              { id: "ok" },
            ]);
            await joplin.views.dialogs.setHtml(
              noteoverviewDialog,
              `
                      <div style="overflow-wrap: break-word;">
                        <h3>Noteoverview error</h3>
                        <p>Note: ${noteTitle}</p>
                        <p>Fields: ${fieldsArray.join(", ")}</p>
                        <p>Sort: ${sortArray.join(", ")}</p>
                      </div>
                      `
            );
            await joplin.views.dialogs.open(noteoverviewDialog);
            
            let settingsOnly = [];
            settingsOnly.push(settingsBlock);
            return settingsOnly;
          }
          for (let queryNotesKey in queryNotes.items) {
            if (queryNotes.items[queryNotesKey].id != noteId) {
              noteCount++;
              let noteInfos = [];
              for (let field in fieldsArray) {
                if (fieldsArray[field] === "title") {
                  let titelEscp: string = await escapeForTable(
                    queryNotes.items[queryNotesKey][fieldsArray[field]]
                  );
                  noteInfos.push(
                    "[" +
                      titelEscp +
                      "](:/" +
                      queryNotes.items[queryNotesKey].id +
                      ")"
                  );
                } else if (
                  [
                    "created_time",
                    "updated_time",
                    "todo_due",
                    "user_created_time",
                    "user_updated_time",
                    "todo_completed",
                  ].indexOf(fieldsArray[field]) > -1
                ) {
                  let dateObject = new Date(
                    queryNotes.items[queryNotesKey][fieldsArray[field]]
                  );
                  let dateString =
                    moment(dateObject.getTime()).format(dateFormat) +
                    " " +
                    moment(dateObject.getTime()).format(timeFormat);
                  if (
                    fieldsArray[field] === "todo_due" &&
                    dateObject.getTime() < now.getTime()
                  ) {
                    noteInfos.push(
                      "<font color='red'>" + dateString + "</font>"
                    );
                  } else {
                    noteInfos.push(dateString);
                  }
                } else if (fieldsArray[field] === "size") {
                  let size: string = await getNoteSize(
                    queryNotes.items[queryNotesKey].id
                  );
                  noteInfos.push(size);
                } else if (fieldsArray[field] === "tags") {
                  let tags: any = await getTags(
                    queryNotes.items[queryNotesKey]["id"]
                  );
                  let tagEscp: string = await escapeForTable(tags.join(", "));
                  noteInfos.push(tagEscp);
                } else if (fieldsArray[field] === "notebook") {
                  let notebook: string = await getNotebookName(
                    queryNotes.items[queryNotesKey]["parent_id"]
                  );
                  let notebookEscp: string = await escapeForTable(notebook);
                  noteInfos.push(notebookEscp);
                } else {
                  let fieldEscp: string = await escapeForTable(
                    queryNotes.items[queryNotesKey][fieldsArray[field]]
                  );
                  noteInfos.push(fieldEscp);
                }
              }
              newBody.push("| " + noteInfos.join(" | ") + " |");
            }
          }
        } while (queryNotes.has_more);

        // Add note count
        const showNoteCount = await joplin.settings.value("showNoteCount");
        if (showNoteCount == "below") {
          newBody.push("Note count: " + noteCount);
        } else if (showNoteCount == "above") {
          newBody.unshift("Note count: " + noteCount);
        }
      } else {
        console.info("No search query");
      }

      newBody.unshift(settingsBlock);
      newBody.push("<!--endoverview-->");
      return newBody;
    }

    async function updateNote(newBodyStr: string, noteId: string) {
      let slectedNote = await joplin.workspace.selectedNote();
      if (slectedNote.id == noteId) {
        await joplin.commands.execute("textSelectAll");
        await joplin.commands.execute("replaceSelection", newBodyStr);
      } else {
        await joplin.data.put(["notes", noteId], null, {
          body: newBodyStr,
        });
      }
    }

    // Escape string for markdown table
    async function escapeForTable(str: string): Promise<string> {
      if (str !== undefined) {
        return str
          .toString()
          .replace(/(?:\|)/g, "\\|")
          .replace(/(?:\r\n|\r|\n)/g, "");
      } else {
        return str;
      }
    }

    // Calculate notes size including resources
    async function getNoteSize(noteId): Promise<string> {
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
          var resources = await joplin.data.get(
            ["notes", noteId, "resources"],
            {
              fields: "id, size",
              limit: 50,
              page: pageNum++,
            }
          );
        } catch (e) {
          console.error("getNoteSize resources " + e);
          return "n/a";
        }

        for (const resource of resources.items) {
          size += Number.parseInt(resource.size);
        }
      } while (resources.has_more);
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

    // Replace fields for header with alias
    async function getHeaderFields(
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
    async function getNotebookName(id): Promise<string> {
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

    // Get all tags title as array for a note id
    async function getTags(noteId): Promise<any> {
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
      return tagNames;
    }

    // Remove all occurens of value from array
    async function arrayRemoveAll(arr: any, value: any): Promise<any> {
      var i = 0;
      while (i < arr.length) {
        if (arr[i] === value) {
          arr.splice(i, 1);
        } else {
          ++i;
        }
      }
      return arr;
    }

    // extract settings from block
    async function getParameter(
      settings: string,
      parameter: string,
      defval: string
    ): Promise<string> {
      var regex = new RegExp("^" + parameter + ":\\s?(.*)$", "im");
      const match = settings.match(regex);
      if (match) {
        return match[1].trim();
      } else {
        return defval;
      }
    }

    // Start timer
    if ((await joplin.settings.value("updateInterval")) > 0) {
      runTimedNoteOverview();
    }
  },
});
