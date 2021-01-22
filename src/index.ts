import joplin from "api";
import { MenuItemLocation } from "api/types";

const moment = require("moment");

joplin.plugins.register({
  onStart: async function () {
    console.info("Note overview plugin started!");

    const noteoverviewDialog = await joplin.views.dialogs.create("noteoverviewDialog");

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

    async function runCreateNoteOverview() {
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
            if (query) {
              // create array from fields
              let fieldsArray = [];
              if (fields) {
                fieldsArray = fields
                  .toLowerCase()
                  .replace(/\s/g, "")
                  .split(",");
              } else {
                fieldsArray = ["update_time", "title"];
              }

              // Remove virtual fields from dbFieldsArray
              let dbFieldsArray = [...fieldsArray];
              dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "notebook");
              dbFieldsArray = await arrayRemoveAll(dbFieldsArray, "tags");

              // field sorting information
              let sortArray = sort.toLowerCase().split(" ");

              let newBody = [];
              newBody.push("| " + fieldsArray.join(" | ") + " |");
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
                  await joplin.views.dialogs.setButtons(noteoverviewDialog, [{ id: "ok" }]);
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
                        noteInfos.push(
                          "[" +
                            queryNotes.items[queryNotesKey].title +
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
                      } else if (fieldsArray[field] === "tags") {
                        let tags: any = await getTags(
                          queryNotes.items[queryNotesKey]["id"]
                        );
                        noteInfos.push(tags.join(", "));
                      } else if (fieldsArray[field] === "notebook") {
                        let notbook: string = await getNotebookName(
                          queryNotes.items[queryNotesKey]["parent_id"]
                        );
                        noteInfos.push(notbook);
                      } else {
                        noteInfos.push(
                          queryNotes.items[queryNotesKey][fieldsArray[field]]
                        );
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
                await joplin.data.put(["notes", noteId], null, {
                  body: newBodyStr,
                });
              }
            } else {
              console.info("No search query");
            }
          }
        }
      } while (overviewNotes.has_more);

      window.setTimeout(runCreateNoteOverview, 1000 * 60 * 5);
    }

    // Get the notbook title froma notebook id
    async function getNotebookName(id): Promise<string> {
      var folder = await joplin.data.get(["folders", id], {
        fields: "title",
      });
      return folder.title;
    }

    // Get all tags title as array for a note id
    async function getTags(noteId): Promise<any> {
      const tagNames = [];
      let pageNum = 1;
      do {
        var tags = await joplin.data.get(["notes", noteId, "tags"], {
          fields: "id, title, parent_id",
          limit: 50,
          page: pageNum++,
        });
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
      var regex = new RegExp("^" + parameter + ":\s?(.*)$", "im");
      const match = settings.match(regex);
      if (match) {
        return match[1].trim();
      } else {
        return defval;
      }
    }

    runCreateNoteOverview();
  },
});
