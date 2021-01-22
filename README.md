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
sort: title DESC
-->
```

- `alias` Rename fields (Optional). `<field> AS <new field name>`, multiple fields comma seperated.

The note content is updated every 5 minutes or manualy by `Tools > Create Note overview`.

## Build

To build your one version of the plugin, install node.js and run the following command `npm run dist`

## Updating the plugin framework

To update the plugin framework, run `npm run update`

## Changelog

- New: field alias

### v1.1.1 (2021-01-19)

- Add more error handling

### v1.1.0 (2021-01-19)

- Use Joplin Date and Time settings
- Add `tags` and `notebook` as fields for output

### v1.0.0 (2021-01-16)

- First version

## Links

- [Joplin - Getting started with plugin development](https://joplinapp.org/api/get_started/plugins/)
- [Joplin - Plugin API reference](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
- [Joplin - Data API reference](https://joplinapp.org/api/references/rest_api/)
- [Joplin - Plugin examples](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins)
