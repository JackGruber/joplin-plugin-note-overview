import joplin from "api";
import { noteoverview } from "./noteoverview";

joplin.plugins.register({
  onStart: async function () {
    await noteoverview.init();
  },
});
