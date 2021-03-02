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

- `search` Search filters like in Joplin [Documentation of search filters](https://joplinapp.org/#search-filters).
- `fields` Which fields should be output in the table (Optional). [Documentation of the possible fields](https://joplinapp.org/api/references/rest_api/#properties), additionally the fields `size`, `tag` and `notebook` available. Default: `updated_time, title`
- `sort` By which field should be sorted, the `size`, `tag` and `notebook` fields can't be sorted (Optional). `<field> DESC/ASC`, Default: `title ASC`.
- `alias` Rename fields (Optional). `<field> AS <new field name>`, multiple fields comma seperated.
- `Show note count` Show the number of notes found. Default: `off`.

The note content is updated every 5 minutes or manualy by `Tools > Create Note overview`.

### Examples

#### ToDo Overview

```
<!-- note-overview-plugin
search: type:todo iscompleted:0
fields: todo_due, title, tags, notebook
sort: todo_due ASC
-->
```

#### Rename fields

```
<!-- note-overview-plugin
search: *
fields: updated_time AS Modified, title
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

Go to `Tools > Options > Note overview`

- `Update interval in minutes`: How often the overview notes should be updated. Default `5`

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
