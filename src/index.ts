import joplin from "api";
import { MenuItemLocation, SettingItemType } from "api/types";
import { settings } from "./settings";
import { noteoverview } from "./noteoverview";
import * as YAML from 'yaml'

let timer = null;

joplin.plugins.register({
  onStart: async function () {
    console.info("Note overview plugin started!");

    await settings.register();

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
          const noteOverviewRegEx = /(<!--\s?note-overview-plugin(?<settings>[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?note-overview-plugin)|$)/gi;
          let regExMatch = null;
          let startOrgTextIndex = 0;
          let startIndex = 0;
          let endIndex = 0;
          while ((regExMatch = noteOverviewRegEx.exec(noteBody)) != null) {
            let settingsBlock = regExMatch['groups']['settings'];
            startIndex = regExMatch.index;
            endIndex = startIndex + regExMatch[0].length;

            let noteovervieSettings = null;
            try {
              noteovervieSettings = YAML.parse(settingsBlock);
            } catch (error) {
              console.error("YAML parse error")
              console.error(error)
              return;
            }

            // add original conten before the settings block
            if (startOrgTextIndex != startIndex) {
              orgContent = noteBody.substring(startOrgTextIndex, startIndex);
              if (startOrgTextIndex == 0) {
                orgContent = await removeNewLineAt(orgContent, false, true);
              } else {
                orgContent = await removeNewLineAt(orgContent, true, true);
              }

              newBody.push(orgContent);
            }
            startOrgTextIndex = endIndex;

            let noteOverviewContent = await getNoteOverviewContent(
              noteId,
              noteTitle,
              noteovervieSettings
            );
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

    async function removeNewLineAt(
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

    // Search notes from query and return content
    async function getNoteOverviewContent(
      noteId: string,
      noteTitle: string,
      noteoverviewSettings: Object
    ): Promise<any> {
      const now = new Date();
      const dateFormat = await joplin.settings.globalValue("dateFormat");
      const timeFormat = await joplin.settings.globalValue("timeFormat");
      const defaultTodoColoring = await noteoverview.getDefaultToDoColors();
      const defaultTodoStatusText = await noteoverview.getDefaultToDoStatusText();

      const query: string = noteoverviewSettings['search'];
      const fields: string = noteoverviewSettings['fields'] ? noteoverviewSettings['fields']: null;
      const sort: string = noteoverviewSettings['sort'] ? noteoverviewSettings['sort']: 'title ASC';
      const alias: string = noteoverviewSettings['alias'] ? noteoverviewSettings['alias']: '';

      const todoColoringObject: object = await noteoverview.getToDoColorObject(
        defaultTodoColoring
      );

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
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "file");
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "file_size");
        dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "status");

        // if a todo field is selected, add the other one to
        if (fieldsArray.includes("todo_due")) {
          dbFieldsArray.push("todo_completed");
        }
        if (fieldsArray.includes("todo_completed")) {
          dbFieldsArray.push("todo_due");
        }

        // include todo fields for the status field calculation
        if (fieldsArray.includes("status")) {
          dbFieldsArray.push("todo_due");
          dbFieldsArray.push("todo_completed");
        }

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
            settingsOnly.unshift (await noteoverview.createSettingsBlock(noteoverviewSettings));
            return settingsOnly;
          }
          for (let queryNotesKey in queryNotes.items) {
            if (queryNotes.items[queryNotesKey].id != noteId) {
              noteCount++;
              let noteInfos = [];
              for (let field in fieldsArray) {
                if (fieldsArray[field] === "title") {
                  let titelEscp: string = await noteoverview.escapeForTable(
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
                  let dateString = await noteoverview.getDateFormated(
                    dateObject.getTime(),
                    dateFormat,
                    timeFormat
                  );

                  if (
                    fieldsArray[field] === "todo_due" ||
                    fieldsArray[field] === "todo_completed"
                  ) {
                    let todoDue = queryNotes.items[queryNotesKey]["todo_due"];
                    let todocompleted =
                      queryNotes.items[queryNotesKey]["todo_completed"];
                    let color = await noteoverview.getToDoDateColor(
                      todoColoringObject,
                      todoDue,
                      todocompleted,
                      fieldsArray[field]
                    );

                    if (color !== "") {
                      noteInfos.push(
                        "<font color='" + color + "'>" + dateString + "</font>"
                      );
                    } else {
                      noteInfos.push(dateString);
                    }
                  } else {
                    noteInfos.push(dateString);
                  }
                } else if (fieldsArray[field] === "status") {
                  let todoDue = queryNotes.items[queryNotesKey]["todo_due"];
                  let todocompleted =
                    queryNotes.items[queryNotesKey]["todo_completed"];
                  let status: string = await noteoverview.getToDoStatus(
                    todoDue,
                    todocompleted
                  );
                  let statusText: string = await noteoverview.escapeForTable(
                    defaultTodoStatusText[status]
                  );
                  noteInfos.push(statusText);
                } else if (fieldsArray[field] === "file") {
                  let filename: string[] = await noteoverview.getFileNames(
                    queryNotes.items[queryNotesKey].id,
                    false
                  );
                  noteInfos.push(filename.join("<br>"));
                } else if (fieldsArray[field] === "file_size") {
                  let filenamesize: string[] = await noteoverview.getFileNames(
                    queryNotes.items[queryNotesKey].id,
                    true
                  );
                  noteInfos.push(filenamesize.join("<br>"));
                } else if (fieldsArray[field] === "size") {
                  let size: string = await getNoteSize(
                    queryNotes.items[queryNotesKey].id
                  );
                  noteInfos.push(size);
                } else if (fieldsArray[field] === "tags") {
                  let tags: any = await noteoverview.getTags(
                    queryNotes.items[queryNotesKey]["id"]
                  );
                  let tagEscp: string = await noteoverview.escapeForTable(
                    tags.join(", ")
                  );
                  noteInfos.push(tagEscp);
                } else if (fieldsArray[field] === "notebook") {
                  let notebook: string = await getNotebookName(
                    queryNotes.items[queryNotesKey]["parent_id"]
                  );
                  let notebookEscp: string = await noteoverview.escapeForTable(
                    notebook
                  );
                  noteInfos.push(notebookEscp);
                } else {
                  let fieldEscp: string = await noteoverview.escapeForTable(
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

      newBody.unshift (await noteoverview.createSettingsBlock(noteoverviewSettings));
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

      return await noteoverview.humanFrendlyStorageSize(size);
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

    // Start timer
    if ((await joplin.settings.value("updateInterval")) > 0) {
      runTimedNoteOverview();
    }
  },
});
