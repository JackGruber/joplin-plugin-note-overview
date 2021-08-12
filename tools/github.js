"use strict";
// https://docs.github.com/en/rest/reference/repos
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
exports.githubAsset = exports.githubRelease = exports.checkAuth = void 0;
var axios_1 = require("axios");
var FormData = require("form-data");
var fs = require("fs-extra");
var mime = require("mime");
var apiRoot = "https://api.github.com";
function checkAuth(options) {
  return __awaiter(this, void 0, void 0, function () {
    var url, headers, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url =
            apiRoot +
            "/repos/" +
            options.owner +
            "/" +
            options.repo +
            "/releases";
          headers = {
            Authorization: "token " + options.token,
            accept: "application/vnd.github.v3+json",
          };
          return [
            4 /*yield*/,
            axios_1["default"].get(url, { headers: headers }),
          ];
        case 1:
          response = _a.sent();
          if (response.status === 200 && response.statusText === "OK") {
            return [2 /*return*/, true];
          } else {
            return [2 /*return*/, false];
          }
          return [2 /*return*/];
      }
    });
  });
}
exports.checkAuth = checkAuth;
function githubRelease(options) {
  return __awaiter(this, void 0, void 0, function () {
    var url, body, headers, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          url =
            apiRoot +
            "/repos/" +
            options.owner +
            "/" +
            options.repo +
            "/releases";
          body = {
            tag_name: options.tag,
            name: options.name,
            body: options.body,
            prerelease: options.prerelease,
          };
          headers = {
            Authorization: "token " + options.token,
            accept: "application/vnd.github.v3+json",
          };
          return [
            4 /*yield*/,
            axios_1["default"].post(url, body, { headers: headers }),
          ];
        case 1:
          response = _a.sent();
          if (response.status !== 201) {
            console.error(response);
            throw new Error("github release error");
          }
          return [2 /*return*/, response.data];
      }
    });
  });
}
exports.githubRelease = githubRelease;
function githubAsset(info) {
  return __awaiter(this, void 0, void 0, function () {
    var cleanUrl, form, state, headers, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          cleanUrl = info.uploadUrl.replace("{?name,label}", "");
          console.log("A");
          form = new FormData();
          console.log("info.asset");
          form.append("file", fs.createReadStream(info.asset));
          state = fs.statSync(info.asset);
          headers = {
            Authorization: "token " + info.token,
            "Content-Type": mime.getType(info.asset),
            "Content-Length": state.size,
            accept: "application/vnd.github.v3+json",
          };
          return [
            4 /*yield*/,
            axios_1["default"].post(
              cleanUrl + "?label=" + info.label + "&name=" + info.name,
              form,
              { headers: headers }
            ),
          ];
        case 1:
          response = _a.sent();
          if (response.status !== 201) {
            console.error(response);
            throw new Error("github asset upload error");
          }
          if (response.data.state !== "uploaded") {
            console.error(response);
            throw new Error("github asset upload error");
          }
          return [2 /*return*/, response.data];
      }
    });
  });
}
exports.githubAsset = githubAsset;
