# Changelog

## not released

## v1.5.4 (2021-10-09)

- Fix: Default value for `Update on Joplin sync`

## v1.5.3 (2021-10-09)

- Add: Option `Update on Joplin sync` to start the Noteoverview update after Joplin syncronisation
- Improved: Start first Noteoverview update after the first Joplin syncronisation (Not as before after 5 minutes)

## v1.5.2 (2021-08-12)

- Fix: #22 Loading error on over 100 notebooks and orphan notebooks

## v1.5.1 (2021-08-08)

- Fix: #21 Note count off settings not respected

## v1.5.0 (2021-08-07)

- Fix: #13 Prevents the current note from being updated by a background run when the note is open for editing
- Add: Option `details` to include overview in a HTML deatils section
- Add: Option `count` to customize note count field for a single overview
- Add: Plugin option `Note count text` to customize note count text
- Add: Option `listview` to display the overview as list instead of a table
- Add: Virtual field `breadcrumb` to display the notebook path

## v1.4.3 (2021-05-17)

- Fix: #12 Prevent note live update on Rich Text (WYSIWYG) editor

## v1.4.2 (2021-05-16)

- Improved: Sort the tags in the field `tags`
- Add: `image` as field, to display a image resource from the note
- Add: `excerpt` as field

## v1.4.1 (2021-05-08)

- Improved: An empty date is output instead of `01/01/1970`
- Add: Option to set the color for `todo_due` and `todo_completed`
- Add: `file` and `file_size` as fields for output
- Add: `status` as fields for todo status output

## v1.4.0 (2021-03-30)

- Add: Multiple note overview definitions in one note
- Add: The note overview can now be embedded in existing text
- Improved: Use registerSettings instead of deprecated registerSetting

❗ Requires at least Joplin v1.8.1 ❗

## v1.3.4 (2021-03-27)

- Fix: todo_completed not outputed as date/time field

## v1.3.3 (2021-02-13)

- Add: #5 Show number of found notes

## v1.3.2 (2021-02-04)

- Fix: Catch error on size, tag and notebook determination

## v1.3.1 (2021-02-01)

- Add: Setting for update intervall

❗ Requires at least Joplin v1.7.1 ❗

## v1.3.0 (2021-01-29)

- Improved: Update the currently selected overview directly

## v1.2.1 (2021-01-23)

- Fix: Escape text for markdown table

## v1.2.0 (2021-01-22)

- Add: Field alias
- Add: `size` as field for output

## v1.1.1 (2021-01-19)

- Improved: Add more error handling

## v1.1.0 (2021-01-19)

- Improved: Use Joplin Date and Time settings
- New: `tag` and `notebook` as fields for output

## v1.0.0 (2021-01-16)

- First version
