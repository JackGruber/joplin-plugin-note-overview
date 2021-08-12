"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
var path = require("path");
var git_1 = require("./git");
var utils_1 = require("./utils");
var github_1 = require("./github");
var dotenv = require("dotenv");
var execCommand_1 = require("./execCommand");
function main() {
  return __awaiter(this, void 0, void 0, function () {
    var argv,
      type,
      info,
      reproOptions,
      versionNumber,
      version,
      releaseOptions,
      releaseResult,
      jpl,
      releaseAssetOptions;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          dotenv.config();
          return [4 /*yield*/, git_1.nothingUncomitted()];
        case 1:
          if (!_a.sent()) {
            throw new Error("Not a clean git status");
          }
          if (
            process.env.GITHUB_TOKEN === undefined ||
            process.env.GITHUB_TOKEN === ""
          ) {
            throw new Error("No GITHUB_TOKEN in env");
          }
          argv = require("yargs").argv;
          if (argv.patch) type = "patch";
          else if (argv.minor) type = "minor";
          else if (argv.major) type = "major";
          else throw new Error("--patch, --minor or --major not provided");
          return [4 /*yield*/, git_1.getBranch()];
        case 2:
          if (_a.sent() !== "develop") {
            throw new Error("not in develop branch");
          }
          return [4 /*yield*/, git_1.getInfo()];
        case 3:
          info = _a.sent();
          console.log(info);
          reproOptions = {
            owner: info.owner,
            repo: info.repo,
            token: process.env.GITHUB_TOKEN,
          };
          return [4 /*yield*/, github_1.checkAuth(reproOptions)];
        case 4:
          if (!_a.sent()) {
            throw new Error("Github auth error");
          }
          console.log("Create release");
          return [4 /*yield*/, utils_1.runNpmVersion(type)];
        case 5:
          _a.sent();
          versionNumber = require(path.resolve(
            path.join(__dirname, "../package.json")
          )).version;
          version = "v" + versionNumber;
          console.log("new version " + version);
          return [4 /*yield*/, utils_1.setPluginVersion(versionNumber)];
        case 6:
          _a.sent();
          return [4 /*yield*/, utils_1.updateChangelog(versionNumber)];
        case 7:
          _a.sent();
          return [
            4 /*yield*/,
            execCommand_1.execCommand(
              "git add src/manifest.json CHANGELOG.md package-lock.json package.json"
            ),
          ];
        case 8:
          _a.sent();
          return [
            4 /*yield*/,
            execCommand_1.execCommand(
              'git commit -m "bump version ' + versionNumber + '"'
            ),
          ];
        case 9:
          _a.sent();
          return [
            4 /*yield*/,
            execCommand_1.execCommand("git checkout master"),
          ];
        case 10:
          _a.sent();
          return [4 /*yield*/, git_1.getBranch()];
        case 11:
          if (_a.sent() !== "master") {
            throw new Error("not in master branch");
          }
          return [
            4 /*yield*/,
            execCommand_1.execCommand("git merge develop --no-ff"),
          ];
        case 12:
          _a.sent();
          return [4 /*yield*/, execCommand_1.execCommand("git tag " + version)];
        case 13:
          _a.sent();
          console.log("Execute the following commands:");
          console.log("git push");
          console.log("git push --tag");
          console.log("npm publish");
          console.log("Create GitHub release");
          releaseOptions = {
            owner: info.owner,
            repo: "testing",
            tag: version,
            name: version,
            prerelease: false,
            token: process.env.GITHUB_TOKEN,
            body: "",
          };
          return [4 /*yield*/, github_1.githubRelease(releaseOptions)];
        case 14:
          releaseResult = _a.sent();
          return [4 /*yield*/, utils_1.getJPLFileName()];
        case 15:
          jpl = _a.sent();
          releaseAssetOptions = {
            token: process.env.GITHUB_TOKEN,
            asset: path.resolve(path.join(__dirname, "..", "publish", jpl)),
            name: jpl,
            label: jpl,
            uploadUrl: releaseResult.upload_url,
          };
          return [4 /*yield*/, github_1.githubAsset(releaseAssetOptions)];
        case 16:
          _a.sent();
          return [2 /*return*/];
      }
    });
  });
}
main()["catch"](function (error) {
  console.error("Fatal error");
  console.error(error);
  process.exit(1);
});
