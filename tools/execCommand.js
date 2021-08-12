"use strict";
// Source copied from Joplin
// https://github.com/laurent22/joplin/blob/5b1a9700448efb6aff423bda1889936c92393cbf/packages/tools/tool-utils.ts#L159-L164
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.execCommand = void 0;
var execa = require("execa");
function execCommand(command, options) {
  if (options === void 0) {
    options = null;
  }
  return __awaiter(this, void 0, void 0, function () {
    var args, executableName, promise, result;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          options = __assign(
            { showInput: true, showOutput: true, quiet: false },
            options
          );
          if (options.quiet) {
            options.showInput = false;
            options.showOutput = false;
          }
          if (options.showInput) {
            if (typeof command === "string") {
              console.info("> " + command);
            } else {
              console.info(
                "> " + commandToString(command[0], command.slice(1))
              );
            }
          }
          args =
            typeof command === "string" ? splitCommandString(command) : command;
          executableName = args[0];
          args.splice(0, 1);
          promise = execa(executableName, args);
          if (options.showOutput) promise.stdout.pipe(process.stdout);
          return [4 /*yield*/, promise];
        case 1:
          result = _a.sent();
          return [2 /*return*/, result.stdout.trim()];
      }
    });
  });
}
exports.execCommand = execCommand;
function commandToString(commandName, args) {
  if (args === void 0) {
    args = [];
  }
  var output = [quotePath(commandName)];
  for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
    var arg = args_1[_i];
    output.push(quotePath(arg));
  }
  return output.join(" ");
}
function quotePath(path) {
  if (!path) return "";
  if (path.indexOf('"') < 0 && path.indexOf(" ") < 0) return path;
  path = path.replace(/"/, '\\"');
  return '"' + path + '"';
}
function splitCommandString(command, options) {
  if (options === void 0) {
    options = null;
  }
  options = options || {};
  if (!("handleEscape" in options)) {
    options.handleEscape = true;
  }
  var args = [];
  var state = "start";
  var current = "";
  var quote = '"';
  var escapeNext = false;
  for (var i = 0; i < command.length; i++) {
    var c = command[i];
    if (state == "quotes") {
      if (c != quote) {
        current += c;
      } else {
        args.push(current);
        current = "";
        state = "start";
      }
      continue;
    }
    if (escapeNext) {
      current += c;
      escapeNext = false;
      continue;
    }
    if (c == "\\" && options.handleEscape) {
      escapeNext = true;
      continue;
    }
    if (c == '"' || c == "'") {
      state = "quotes";
      quote = c;
      continue;
    }
    if (state == "arg") {
      if (c == " " || c == "\t") {
        args.push(current);
        current = "";
        state = "start";
      } else {
        current += c;
      }
      continue;
    }
    if (c != " " && c != "\t") {
      state = "arg";
      current += c;
    }
  }
  if (state == "quotes") {
    throw new Error("Unclosed quote in command line: " + command);
  }
  if (current != "") {
    args.push(current);
  }
  if (args.length <= 0) {
    throw new Error("Empty command line");
  }
  return args;
}
