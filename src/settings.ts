import joplin from "api";
import { SettingItemType } from "api/types";
import { i18n } from "./noteoverview";

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
        label: i18n.__("settings.updateInterval.label"),
        description: i18n.__("settings.updateInterval.description"),
      },
      updateOnSync: {
        value: "no",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        isEnum: true,
        public: true,
        label: i18n.__("settings.updateOnSync.label"),
        options: {
          yes: i18n.__("settings.updateOnSync.values.yes"),
          no: i18n.__("settings.updateOnSync.values.no"),
        },
        description: i18n.__("settings.updateOnSync.description"),
      },
      showNoteCount: {
        value: "off",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        isEnum: true,
        public: true,
        label: i18n.__("settings.showNoteCount.label"),
        options: {
          off: i18n.__("settings.showNoteCount.values.off"),
          above: i18n.__("settings.showNoteCount.values.above"),
          below: i18n.__("settings.showNoteCount.values.below"),
        },
        description: i18n.__("settings.showNoteCount.description"),
      },
      showNoteCountText: {
        value: "Note count: {{count}}",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        advanced: true,
        label: i18n.__("settings.showNoteCountText.label"),
        description: i18n.__(
          "settings.showNoteCountText.description",
          "{{count}}"
        ),
      },

      noteStatus: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.noteStatus.label", "note"),
        description: i18n.__("settings.noteStatus.description"),
      },
      todoStatusOpen: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.todoStatusOpen.label", "open todo"),
        description: i18n.__("settings.todoStatusOpen.description"),
      },
      todoStatusDone: {
        value: "✔",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.todoStatusDone.label", "todo completed"),
        description: i18n.__("settings.todoStatusDone.description"),
      },
      todoStatusOverdue: {
        value: "❗",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.todoStatusOverdue.label", "todo over due"),
        description: i18n.__("settings.todoStatusOverdue.description"),
      },

      colorTodoOpen: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.colorTodoOpen.label", "todo [open]"),
        description: i18n.__("settings.colorTodoOpen.description", "due_date"),
      },
      colorTodoWarning: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.colorTodoWarning.label", "todo [warning]"),
        description: i18n.__(
          "settings.colorTodoWarning.description",
          "due_date"
        ),
      },
      todoWarningHours: {
        value: 0,
        minimum: 0,
        maximum: 2880,
        type: SettingItemType.Int,
        section: "noteOverviewSection",
        advanced: true,
        public: true,
        label: i18n.__("settings.todoWarningHours.label", "todo [warning]"),
        description: i18n.__(
          "settings.todoWarningHours.description",
          "due_date"
        ),
      },
      colorTodoOpenOverdue: {
        value: "red",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__(
          "settings.colorTodoOpenOverdue.label",
          "todo [open_overdue]"
        ),
        description: i18n.__(
          "settings.colorTodoOpenOverdue.description",
          "due_date"
        ),
      },
      colorTodoDone: {
        value: "limegreen,limegreen",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__("settings.colorTodoDone.label", "todo [done]"),
        description: i18n.__("settings.colorTodoDone.description", {
          field_due_date: "due_date",
          field_todo_completed: "todo_completed",
        }),
      },
      colorTodoDoneOverdue: {
        value: "orange,orange",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__(
          "settings.colorTodoDoneOverdue.label",
          "todo [done_overdue]"
        ),
        description: i18n.__("settings.colorTodoDoneOverdue.description", {
          field_due_date: "due_date",
          field_todo_completed: "todo_completed",
        }),
      },
      colorTodoDoneNodue: {
        value: "",
        advanced: true,
        type: SettingItemType.String,
        section: "noteOverviewSection",
        public: true,
        label: i18n.__(
          "settings.colorTodoDoneNodue.label",
          "todo [done_nodue]"
        ),
        description: i18n.__(
          "settings.colorTodoDoneNodue.description",
          "todo_completed"
        ),
      },
      fileLogLevel: {
        value: "info",
        type: SettingItemType.String,
        section: "noteOverviewSection",
        advanced: true,
        isEnum: true,
        public: true,
        label: i18n.__("settings.fileLogLevel.label"),
        description: i18n.__("settings.fileLogLevel.description"),
        options: {
          false: i18n.__("settings.fileLogLevel.values.false"),
          verbose: i18n.__("settings.fileLogLevel.values.verbose"),
          info: i18n.__("settings.fileLogLevel.values.info"),
          warn: i18n.__("settings.fileLogLevel.values.warn"),
          error: i18n.__("settings.fileLogLevel.values.error"),
        },
      },
    });
  }
}
