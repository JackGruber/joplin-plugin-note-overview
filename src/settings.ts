import joplin from "api";
import { SettingItemType } from "api/types";

export namespace settings {
  export async function register() {
    await joplin.settings.registerSection("noteOverviewSection", {
      label: "Note overview",
      iconName: "fas fa-binoculars",
    });

    await joplin.settings.registerSettings({
      updateInterval: {
        value: 5,
        minimum: 0,
        maximum: 2880,
        type: SettingItemType.Int,
        section: "noteOverviewSection",
        public: true,
        label: "Update interval in minutes",
        description: "0 = disable automatic note overview creation",
      },
      showNoteCount: {
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
      },

      colorTodoOpen: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: ToDo",
        description: "HTML color for due_date, when the todo is not completed.",
      },
      colorTodoOpenOverdue: {
        value: "red",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: ToDo, over due date",
        description:
          "HTML color for due_date, when the ToDo is over the due date.",
      },
      colorTodoDone: {
        value: "green;green",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: ToDo done",
        description:
          "HTML color for due_date and todo_completed (Seperated by a ;), when the todo is completed.",
      },
      colorTodoDoneOverdue: {
        value: "orange;orange",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: ToDo done, over due",
        description:
          "HTML color for due_date and todo_completed (Seperated by a ;), was completed after the due date.",
      },
      colorTodoDoneNodue: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: ToDo, done, no due date",
        description:
          "HTML color for todo_completed, when the ToDo was completed but no due date set.",
      },
    });
  }
}
