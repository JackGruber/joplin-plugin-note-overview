import joplin from "api";
import { MenuItemLocation } from "api/types";

const moment = require('moment');

joplin.plugins.register({
  onStart: async function () {
    console.info("Note overview plugin started!");

    await joplin.commands.register({
      name: "createNoteOverview",
      label: "Create note overview",
      execute: async () => {
        runCreateNoteOverview();
      }
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
            let sort: string = await getParameter(settingsBlock, "sort", "title ASC");
            if (query) {
              let fieldsArray = [];
              if (fields) {
                fieldsArray = fields
                  .toLowerCase()
                  .replace(/\s/g, "")
                  .split(",");
              } else {
                fieldsArray = ["update_time", "title"];
              }
              let sortArray = sort.toLowerCase().split(" ");
              let newBody = [];
              newBody.push("| " + fieldsArray.join(" | ") + " |");
              newBody.push("|" + " --- |".repeat(fieldsArray.length));

              if(!sortArray[1]){
                sortArray[1] = "ASC"
              }
              let pageQueryNotes = 1;
              do {
                queryNotes = await joplin.data.get(["search"], {
                  query: query,
                  fields: "id," + fieldsArray.join(","),
                  order_by: sortArray[0],
                  order_dir: sortArray[1].toUpperCase(),
                  limit: 50,
                  page: pageQueryNotes++,
                });
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
                        let dateString = moment(dateObject.getTime()).format(dateFormat) + " " + moment(now.getTime()).format(timeFormat);
                        if(fieldsArray[field] === "todo_due" && dateObject.getTime() < now.getTime()){
                          noteInfos.push("<font color='red'>" + dateString + "</font>");
                        }
                        else{
                          noteInfos.push(dateString);
                        }
                        
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
