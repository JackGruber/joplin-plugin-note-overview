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
      updateOnSync: {
        value: "off",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        isEnum: true,
        public: true,
        label: "Update on Joplin sync",
        options: {
          yes: "Yes",
          no: "No",
        },
        description:
          "Update the Noteoverview after a Joplin syncronisation. Independent of the update interval.",
      },
      showNoteCount: {
        value: "off",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        isEnum: true,
        public: true,
        label: "Show note count",
        options: {
          off: "Off",
          above: "Above",
          below: "Below",
        },
      },
      showNoteCountText: {
        value: "Note count: {{count}}",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        advanced: true,
        label: "Note count text",
        description:
          "Text for the display of the found notes, {{count}} is replace with the number of matched notes",
      },

      todoStatusOpen: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Field status: open todo",
        description:
          "Text for the status field, when the todo is not completed.",
      },
      todoStatusDone: {
        value: "✔",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Field status: todo completed",
        description: "Text for the status field, when the todo is completed.",
      },
      todoStatusOverdue: {
        value: "❗",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Field status: todo over due",
        description:
          "Text for the `status` field, when the due date of the todo is exceeded.",
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
        value: "limegreen,limegreen",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [done]",
        description:
          "HTML color for the due_date and todo_completed, when the todo is completed. Seperate the color for due_date and todo_completed by a comma.",
      },
      colorTodoDoneOverdue: {
        value: "orange,orange",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: "Color: todo [done_overdue]",
        description:
          "HTML color for the due_date and todo_completed, when the todo was completed after the due date. Seperate the color for due_date and todo_completed by a comma.",
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
