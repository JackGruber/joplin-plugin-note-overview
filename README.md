# Joplin note overview

A note overview is created based on the defined search and the specified fields.

<img src=img/main.jpg>

## Installation

### Automatic

- Go to `Tools > Options > Plugins`
- Search for `Note overview`
- Click Install plugin
- Restart Joplin to enable the plugin

### Manual

- Download the latest released JPL package (`io.github.jackgruber.note-overview.jpl`) from [here](https://github.com/JackGruber/joplin-plugin-note-overview/releases/latest)
- Close Joplin
- Copy the downloaded JPL package in your profile `plugins` folder
- Start Joplin

## Usage

Create one or more notes with the following content:

```md
<!-- note-overview-plugin
search: -tag:*
fields: updated_time, title
alias: updated_time AS Last edit, title AS Title
sort: title DESC
-->
```

Several of these blocks can be included in one note, also between text.

The note content is updated every x minutes (depending on your setting) or manualy by `Tools > Create Note overview`.

### Codeblock options

Options which can be specified in the codeblock.

| Option | Required | Description | Default |
| --- | --- | --- | --- |
| `search` | Yes | Search filters like in Joplin [Documentation of search filters](https://joplinapp.org/#search-filters). | |
| `fields` | No | Which fields should be output in the table.<br>[Documentation of the possible fields](https://joplinapp.org/api/references/rest_api/#properties)<br>Additionally the fields `size`, `tag` and `notebook` is available. | `updated_time, title` |
|`sort`|No|By which field should be sorted, the `size`, `tag` and `notebook` fields can't be sorted.<br>`<field> DESC/ASC`| `title ASC`|
| `alias` | No | Rename fields `<field> AS <new field name>`, multiple fields comma seperated. ||
| `todocolor` | No | Coloring rule for `todo_due` and `todo_completed` [More infos](#codeblock-option-for-todocolor). | Defaults from settings |

#### Codeblock option for todocolor

The color options can be combined freely and are separated from each other by `,`. The colors are specified as html color code.
If an option is not set, the color is taken from the plugin settings.
The following color options are available:

| Option | Description |
| --- | --- |
| `open` | HTML color for the `due_date`, when the todo is not completed. |
| `open_overdue` | HTML color for the `due_date`, when the todo is over the due date. |
| `done` | HTML color for the `due_date` and `todo_completed`, when the todo is completed. Seperate the color for due_date and todo_completed by a `;`. |
| `done_overdue` | HTML color for the `due_date` and `todo_completed`, when the todo was completed after the due date. Seperate the color for due_date and todo_completed by a `;` |
| `done_nodue` | HTML color for the `todo_completed`, when the todo was completed but no due date was set. |

Examples:

- `todocolor: open_overdue:#FF0000`
- `todocolor: open_overdue:#FF0000,done:#00FF00;#00FF00`

### Examples

#### ToDo Overview

```
<!-- note-overview-plugin
search: type:todo iscompleted:0
fields: todo_due, title, tags, notebook
sort: todo_due ASC
-->
```

#### Open ToDos for the next 7 days and overdue ToDos

```
<!-- note-overview-plugin
search: -due:day+7 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

#### Exclude ToDos with no due date

```
<!-- note-overview-plugin
search: due:19700201 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

#### Show all ToDos with no due date

```
<!-- note-overview-plugin
search: -due:19700201 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

#### Set colors for ToDo

```
<!-- note-overview-plugin
search: type:todo
fields: todo_due, todo_completed, title
sort: todo_due ASC
todocolor: open_overdue:#FF0000,done:#00FF00;#00FF00,done_overdue:#FFBF00;#FFBF00
-->
```

#### Rename fields

```
<!-- note-overview-plugin
search: *
fields: updated_time, title
alias: updated_time AS Modified
-->
```

#### Notes without a tag

```
<!-- note-overview-plugin
search: -tag:*
fields: updated_time, title
-->
```

#### Notes createt last 7 days

```
<!-- note-overview-plugin
search: created:day-7
fields: title, updated_time
sort: title DESC
-->
```

## Options

Settings for the plugin, accessible at `Tools > Options > Note overview`.

| Option  | Description | Default |
| --- | --- | --- |
| `Show note count` | Show the number of notes found. | `off`| 
| `Update interval in minutes` | How often the overview notes should be updated. | `5` |
| `Color: todo [open]` | HTML color for the `due_date`, when the todo is not completed. |  |
| `Color: todo [open_overdue]` | HTML color for the `due_date`, when the todo is over the due date. | `red` |
| `Color: todo [done]` | HTML color for the `due_date` and `todo_completed`, when the todo is completed. Seperate the color for due_date and todo_completed by a `;`. | `green` |
| `Color: todo [done_overdue]` | HTML color for the `due_date` and `todo_completed`, when the todo was completed after the due date. Seperate the color for due_date and todo_completed by a `;` | `orange;orange` |
| `Color: todo [done_nodue]` | HTML color for the `todo_completed`, when the todo was completed but no due date was set. |  |

## Keyboard Shortcuts

Under `Options > Keyboard Shortcuts` you can assign a keyboard shortcut for the following commands:

- `Create note overview`

## Build

To build your one version of the plugin, install node.js and run the following command `npm run dist`

## Updating the plugin framework

To update the plugin framework, run `npm run update`

## Changelog

See [Changelog](CHANGELOG.md)

## Links

- [Joplin - Getting started with plugin development](https://joplinapp.org/api/get_started/plugins/)
- [Joplin - Plugin API reference](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
- [Joplin - Data API reference](https://joplinapp.org/api/references/rest_api/)
- [Joplin - Plugin examples](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins)
