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
    });
  }
}
