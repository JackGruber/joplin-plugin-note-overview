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
        label: "Color: todo [open]",
        description:
          "HTML color for the due_date, when the todo is not completed.",
      },
      colorTodoOpenOverdue: {
        value: "red",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [open_overdue]",
        description:
          "HTML color for the due_date, when the todo is over the due date.",
      },
      colorTodoDone: {
        value: "limegreen;limegreen",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [done]",
        description:
          "HTML color for the due_date and todo_completed, when the todo is completed. Seperate the color for due_date and todo_completed by a semicolon.",
      },
      colorTodoDoneOverdue: {
        value: "orange;orange",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [done_overdue]",
        description:
          "HTML color for the due_date and todo_completed, when the todo was completed after the due date. Seperate the color for due_date and todo_completed by a semicolon.",
      },
      colorTodoDoneNodue: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [done_nodue]",
        description:
          "HTML color for the todo_completed, when the todo was completed but no due date was set.",
      },
    });
  }
}
