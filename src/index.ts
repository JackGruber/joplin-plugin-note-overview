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
      const now = new Date();
      const dateFormat = await joplin.settings.globalValue("dateFormat");
      const timeFormat = await joplin.settings.globalValue("timeFormat");

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
          let settingsBlock = noteBody.match(/^(<!--(?:.|\n)*?-->)/);
          if (settingsBlock) {
            console.info("Check note " + noteTitle + " (" + noteId + ")");
            settingsBlock = settingsBlock[1];
            let query: string = await getParameter(
              settingsBlock,
              "search",
              null
            );
            let fields: string = await getParameter(
              settingsBlock,
              "fields",
              null
            );
            let sort: string = await getParameter(
              settingsBlock,
              "sort",
              "title ASC"
            );
            const alias: string = await getParameter(
              settingsBlock,
              "alias",
              ""
            );

            if (query) {
              // create array from fields
              let fieldsArray = [];
              if (fields) {
                fieldsArray = fields
                  .toLowerCase()
                  .replace(/\s/g, "")
                  .split(",");
              } else {
                fieldsArray = ["updated_time", "title"];
              }

              // Remove virtual fields from dbFieldsArray
              let dbFieldsArray = [...fieldsArray];
              dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "notebook");
              dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "tags");
              dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "size");

              // field sorting information
              let sortArray = sort.toLowerCase().split(" ");

              // Field alias for header
              const headerFields = await getHeaderFields(alias, [
                ...fieldsArray,
              ]);

              let newBody = [];
              newBody.push("| " + headerFields.join(" | ") + " |");
              newBody.push("|" + " --- |".repeat(fieldsArray.length));

              if (!sortArray[1]) {
                sortArray[1] = "ASC";
              }
              let pageQueryNotes = 1;

              // Search notes from query and add info to new body
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
                  throw e;
                }
                for (let queryNotesKey in queryNotes.items) {
                  if (queryNotes.items[queryNotesKey].id != noteId) {
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
                        let tagEscp: string = await escapeForTable(
                          tags.join(", ")
                        );
                        noteInfos.push(tagEscp);
                      } else if (fieldsArray[field] === "notebook") {
                        let notebook: string = await getNotebookName(
                          queryNotes.items[queryNotesKey]["parent_id"]
                        );
                        let notebookEscp: string = await escapeForTable(
                          notebook
                        );
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

              // Note update needed?
              let newBodyStr = settingsBlock + "\n" + newBody.join("\n");
              if (noteBody != newBodyStr) {
                console.info("Update note " + noteTitle + " (" + noteId + ")");
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
            } else {
              console.info("No search query");
            }
          }
        }
      } while (overviewNotes.has_more);
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
