import joplin from "api";
import { noteoverview } from "./noteoverview";
import * as YAML from "yaml";
import { mergeObject } from "./helper";

joplin.plugins.register({
  onStart: async function () {
    await noteoverview.init();
  },
});
